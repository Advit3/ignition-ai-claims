// =============================================================================
// claim.service.js — CORE CLAIM PROCESSING ENGINE
// =============================================================================
// "Fat Service" — claim submission pipeline with ML retry logic, STP engine,
// status lifecycle management.
// =============================================================================

import crypto from "crypto";
import axios from "axios";
import { Claim } from "../models/claim.model.js";
import { StpConfig } from "../models/stpConfig.model.js";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/logger.js";
import {
    CLAIM_STATUS,
    ALLOWED_TRANSITIONS,
    CLAIM_CONFIG,
    STP_CONFIG_NAME,
    DEFAULT_STP,
    DEFAULT_PAGE,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
    ML_RETRY_ATTEMPTS,
    ML_RETRY_DELAY_MS,
    ML_FALLBACK_FRAUD_SCORE,
    ML_REQUEST_TIMEOUT_MS,
} from "../constants/appConstants.js";
import { ML_ENDPOINTS } from "../constants/mlServiceContract.js";

// ─── HELPER: Delay for exponential backoff ──────────────────────────────────
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── HELPER: Generate unique claim_id ───────────────────────────────────────
/**
 * @returns {string} e.g., "CLM-a1b2c3"
 */
const generateClaimId = () => {
    const hex = crypto.randomBytes(CLAIM_CONFIG.ID_BYTE_LENGTH).toString("hex");
    return `${CLAIM_CONFIG.ID_PREFIX}${hex}`;
};

// ─── ML SERVICE CALL WITH RETRY + CIRCUIT BREAKER ───────────────────────────
/**
 * Calls the Python ML microservice with exponential backoff retries.
 * If ALL retries fail, falls back to a high fraud score.
 *
 * @param {Object} claimPayload — data to send to the ML service
 * @param {string} requestId    — UUID for distributed tracing
 * @returns {{ fraud_score, ocr_data, doc_match, anomaly_flags, processing_ms, ml_raw_response }}
 */
const callMLService = async (claimPayload, requestId) => {
    const mlBaseUrl = process.env.ML_SERVICE_URL || process.env.PYTHON_ML_API_URL;

    // Dev mode: no ML URL configured → use fallback
    if (!mlBaseUrl) {
        logger.warn("ML_SERVICE_URL not set — using fallback fraud score", { requestId });
        return {
            fraud_score: ML_FALLBACK_FRAUD_SCORE,
            ocr_data: {},
            doc_match: 0,
            anomaly_flags: [],
            processing_ms: 0,
            ml_raw_response: null,
        };
    }

    const mlUrl = `${mlBaseUrl}${ML_ENDPOINTS.ANALYZE_CLAIM}`;

    for (let attempt = 1; attempt <= ML_RETRY_ATTEMPTS; attempt++) {
        try {
            const response = await axios.post(mlUrl, claimPayload, {
                timeout: ML_REQUEST_TIMEOUT_MS,
                headers: {
                    "Content-Type": "application/json",
                    "X-Request-Id": requestId,
                },
            });

            const {
                fraud_score = ML_FALLBACK_FRAUD_SCORE,
                ocr_data = {},
                doc_match = 0,
                anomaly_flags = [],
                processing_ms = 0,
            } = response.data;

            logger.info("ML service responded", {
                requestId,
                attempt,
                fraud_score,
                processing_ms,
            });

            return {
                fraud_score,
                ocr_data,
                doc_match,
                anomaly_flags,
                processing_ms,
                ml_raw_response: response.data,
            };
        } catch (error) {
            logger.warn(`ML service attempt ${attempt}/${ML_RETRY_ATTEMPTS} failed`, {
                requestId,
                error: error.code || error.message,
            });

            if (attempt === ML_RETRY_ATTEMPTS) {
                // All retries exhausted — engage circuit breaker
                logger.error("ML service circuit breaker engaged — all retries failed", {
                    requestId,
                    fallback_fraud_score: ML_FALLBACK_FRAUD_SCORE,
                });

                return {
                    fraud_score: ML_FALLBACK_FRAUD_SCORE,
                    ocr_data: {},
                    doc_match: 0,
                    anomaly_flags: [],
                    processing_ms: 0,
                    ml_raw_response: null,
                };
            }

            // Exponential backoff before next retry
            await delay(ML_RETRY_DELAY_MS * Math.pow(2, attempt - 1));
        }
    }
};

// ─── STP RULES ENGINE ───────────────────────────────────────────────────────
/**
 * Evaluates dynamic STP thresholds to determine claim status.
 *
 * @param {number} fraudScore  — 0.0 to 1.0
 * @param {number} claimAmount — dollar amount
 * @returns {string} One of CLAIM_STATUS values
 */
const evaluateStpRules = async (fraudScore, claimAmount) => {
    const config = await StpConfig.findOne({ config_name: STP_CONFIG_NAME });

    const autoApprove = config?.auto_approve_threshold ?? DEFAULT_STP.AUTO_APPROVE_THRESHOLD;
    const autoReject = config?.auto_reject_threshold ?? DEFAULT_STP.AUTO_REJECT_THRESHOLD;
    const maxAmount = config?.max_stp_amount ?? DEFAULT_STP.MAX_STP_AMOUNT;

    if (fraudScore < autoApprove && claimAmount <= maxAmount) {
        return CLAIM_STATUS.APPROVED;
    }
    if (fraudScore > autoReject) {
        return CLAIM_STATUS.REJECTED;
    }
    return CLAIM_STATUS.PENDING;
};

// =============================================================================
// PUBLIC SERVICE METHODS
// =============================================================================

/**
 * submitClaim — orchestrates the full claim submission pipeline.
 * Calls ML service with retry logic, runs STP engine, saves.
 *
 * @param {Object} claimData — { user_id, claim_type, claim_amount, document_url, description }
 * @returns {Object} saved Claim document
 */
export const submitClaim = async (claimData) => {
    const { user_id, claim_type, claim_amount, document_url, description } = claimData;

    const claim_id = generateClaimId();
    const requestId = crypto.randomUUID();

    // Build ML payload
    const mlPayload = {
        claim_id,
        user_id,
        claim_amount,
        claim_type,
        document_url,
        description,
        request_id: requestId,
    };

    // Call ML with retry + circuit breaker
    const mlResult = await callMLService(mlPayload, requestId);

    // Evaluate STP rules
    const claimStatus = await evaluateStpRules(mlResult.fraud_score, claim_amount);

    // Persist claim
    const newClaim = await Claim.create({
        claim_id,
        user_id,
        claim_amount,
        claim_type,
        document_url,
        description,
        fraud_score: mlResult.fraud_score,
        claim_status: claimStatus,
        ocr_data: mlResult.ocr_data,
        doc_match: mlResult.doc_match,
        ml_request_id: requestId,
        ml_raw_response: mlResult.ml_raw_response,
    });

    logger.info("Claim submitted", {
        claim_id,
        claim_status: claimStatus,
        fraud_score: mlResult.fraud_score,
        requestId,
    });

    return newClaim;
};

/**
 * Fetches a paginated list of claims belonging to a specific user.
 *
 * @param {string} userId - The string user_id of the logged-in user
 * @param {object} queryParams - { page, limit } from req.query
 * @returns {object} { claims, total, page, limit, total_pages }
 */
export const getUserClaims = async (userId, queryParams = {}) => {
    // Parse and clamp pagination values using constants
    const page = Math.max(1, parseInt(queryParams.page) || DEFAULT_PAGE);
    const limit = Math.min(
        MAX_PAGE_SIZE,
        Math.max(1, parseInt(queryParams.limit) || DEFAULT_PAGE_SIZE)
    );
    const skip = (page - 1) * limit;

    // Build query — only return claims owned by this user
    const query = { user_id: userId };

    // If a status filter is passed, apply it
    if (queryParams.status && Object.values(CLAIM_STATUS).includes(queryParams.status)) {
        query.claim_status = queryParams.status;
    }

    // Run count and fetch in parallel for performance
    const [total, claims] = await Promise.all([
        Claim.countDocuments(query),
        Claim.find(query)
            .sort({ created_at: -1 })       // newest first
            .skip(skip)
            .limit(limit)
            .select("-ml_raw_response")     // hide raw ML payload from user
            .lean(),                         // plain JS objects — faster
    ]);

    return {
        claims,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
    };
};

/**
 * Fetches a single claim by its custom claim_id.
 * Enforces ownership — a regular user can only see their own claim.
 *
 * @param {string} claimId  - The claim's custom ID (e.g., "CLM-123")
 * @param {string} userId   - The logged-in user's custom user_id string
 * @param {boolean} isAdmin - If true, skip ownership check
 * @returns {object} The claim document
 */
export const getClaimById = async (claimId, userId, isAdmin = false) => {
    // FIXED: Using findOne with claim_id instead of findById
    const query = isAdmin ? { claim_id: claimId } : { claim_id: claimId, user_id: userId };
    const claim = await Claim.findOne(query).lean();

    if (!claim) {
        throw new ApiError(404, "Claim not found");
    }

    return claim;
};

/**
 * Updates the status of a claim.
 * Enforces the state machine — only allowed transitions proceed.
 *
 * @param {string} claimId - The claim's custom claim_id
 * @param {object} payload - { status, reason }
 * @param {string} actorId - Custom user_id of the user making the change
 * @returns {object} The updated claim document
 */
export const updateClaimStatus = async (claimId, payload, actorId) => {
    const { status: newStatus, reason } = payload;

    // FIXED: Using findOne with claim_id instead of findById
    const claim = await Claim.findOne({ claim_id: claimId });
    if (!claim) {
        throw new ApiError(404, "Claim not found");
    }

    const currentStatus = claim.claim_status;

    // Enforce state machine transition rules from constants
    const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(newStatus)) {
        throw new ApiError(
            400,
            `Cannot transition claim from "${currentStatus}" to "${newStatus}". ` +
            `Allowed transitions: ${allowedNext.join(", ") || "none"}`
        );
    }

    // Require a reason when rejecting or escalating
    if (
        (newStatus === CLAIM_STATUS.REJECTED || newStatus === CLAIM_STATUS.ESCALATED)
        && !reason
    ) {
        throw new ApiError(400, `A reason is required when setting status to "${newStatus}"`);
    }

    // Apply the update
    claim.claim_status = newStatus;
    claim.status_reason = reason || null;
    claim.updated_by = actorId;
    claim.updated_at = new Date();

    await claim.save();

    return claim.toObject();
};