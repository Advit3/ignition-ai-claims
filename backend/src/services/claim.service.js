// =============================================================================
// claim.service.js — CORE CLAIM PROCESSING ENGINE
// =============================================================================
// "Fat Service" — contains ALL business logic for claim submission:
//   1. Custom claim_id generation
//   2. HTTP call to the Python ML microservice (with Circuit Breaker)
//   3. STP rules evaluation (approve / reject / pending)
//   4. Persistence to MongoDB
// =============================================================================

import crypto from 'crypto';
import axios from 'axios';
import { Claim } from '../models/claim.model.js';
import { StpConfig } from '../models/stpConfig.model.js';
import { ApiError } from '../utils/ApiError.js';
import {
    HTTP,
    CLAIM_CONFIG,
    CLAIM_STATUS,
    NETWORK_CONFIG,
    STP_CONFIG_NAME,
    DEFAULT_STP,
} from '../constants/appConstants.js';

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

/**
 * Generates a unique claim_id like "CLM-a1b2c3".
 * Uses cryptographic randomness — no collisions in realistic volumes.
 * @returns {string}
 */
const generateClaimId = () => {
    const hex = crypto.randomBytes(CLAIM_CONFIG.ID_BYTE_LENGTH).toString('hex');
    return `${CLAIM_CONFIG.ID_PREFIX}${hex}`;
};

/**
 * ─── CIRCUIT BREAKER: Call the Python ML Microservice ───────────────────────
 *
 * Makes an HTTP POST to the external Python ML API with a strict timeout.
 * If the call fails for ANY reason (network, timeout, 5xx, etc.), we fall back
 * gracefully instead of crashing the entire claim submission flow.
 *
 * Fallback behaviour:
 *   - fraud_score → NETWORK_CONFIG.FALLBACK_FRAUD_SCORE (0.99) so the claim
 *     goes to manual review, NOT auto-approved.
 *   - ocr_data   → empty object (no extracted text available)
 *   - doc_match   → 0 (no confidence)
 *
 * @param {Object} claimPayload — data sent to the Python service
 * @returns {{ fraud_score: number, ocr_data: Object, doc_match: number }}
 */
const callMLService = async (claimPayload) => {
    const mlApiUrl = process.env.PYTHON_ML_API_URL;

    // If no ML URL is configured, skip the call entirely (dev mode)
    if (!mlApiUrl) {
        console.warn("⚠️  PYTHON_ML_API_URL not set — using fallback fraud score.");
        return {
            fraud_score: NETWORK_CONFIG.FALLBACK_FRAUD_SCORE,
            ocr_data:    {},
            doc_match:   0,
        };
    }

    try {
        const response = await axios.post(mlApiUrl, claimPayload, {
            timeout: NETWORK_CONFIG.ML_TIMEOUT_MS,
            headers: { 'Content-Type': 'application/json' },
        });

        // Destructure with safe defaults in case the Python API returns partial data
        const {
            fraud_score = NETWORK_CONFIG.FALLBACK_FRAUD_SCORE,
            ocr_data    = {},
            doc_match   = 0,
        } = response.data;

        return { fraud_score, ocr_data, doc_match };

    } catch (error) {
        // ── CIRCUIT BREAKER ACTIVATED ────────────────────────────────────
        // Log the failure but DO NOT throw — return safe fallback values.
        console.error(
            `🔴 ML Service failure [${error.code || error.message}] — ` +
            `Circuit breaker engaged. Using fallback fraud_score: ${NETWORK_CONFIG.FALLBACK_FRAUD_SCORE}`
        );

        return {
            fraud_score: NETWORK_CONFIG.FALLBACK_FRAUD_SCORE,
            ocr_data:    {},
            doc_match:   0,
        };
    }
};

/**
 * ─── STP RULES ENGINE ──────────────────────────────────────────────────────
 *
 * Fetches the live STP thresholds from MongoDB and determines the claim status:
 *   - fraud_score < auto_approve_threshold  AND  amount ≤ max_stp_amount → APPROVED
 *   - fraud_score > auto_reject_threshold   → REJECTED
 *   - Everything else                       → PENDING (manual review)
 *
 * @param {number} fraudScore  — 0.0 to 1.0
 * @param {number} claimAmount — dollar amount of the claim
 * @returns {string} One of CLAIM_STATUS values
 */
const evaluateStpRules = async (fraudScore, claimAmount) => {
    // Fetch the single global config document, or use hardcoded defaults
    const config = await StpConfig.findOne({ config_name: STP_CONFIG_NAME });

    const autoApprove = config?.auto_approve_threshold ?? DEFAULT_STP.AUTO_APPROVE_THRESHOLD;
    const autoReject  = config?.auto_reject_threshold  ?? DEFAULT_STP.AUTO_REJECT_THRESHOLD;
    const maxAmount   = config?.max_stp_amount         ?? DEFAULT_STP.MAX_STP_AMOUNT;

    // ── Decision Tree ───────────────────────────────────────────────────
    // Rule 1: Low fraud AND within the dollar cap → auto-approve
    if (fraudScore < autoApprove && claimAmount <= maxAmount) {
        return CLAIM_STATUS.APPROVED;
    }

    // Rule 2: High fraud → auto-reject
    if (fraudScore > autoReject) {
        return CLAIM_STATUS.REJECTED;
    }

    // Rule 3: Everything else → needs a human
    return CLAIM_STATUS.PENDING;
};

// =============================================================================
// PUBLIC SERVICE METHODS
// =============================================================================

/**
 * submitClaim — orchestrates the full claim submission pipeline.
 *
 * @param {Object} claimData — validated claim fields from the controller
 * @param {Object} user      — the authenticated user from req.user
 * @returns {Object} the saved Mongoose Claim document
 */
export const submitClaim = async (claimData, user) => {
    const { claim_amount, claim_type, description, documents } = claimData;

    // ── 1. Generate a unique claim ID ───────────────────────────────────
    const claim_id = generateClaimId();

    // ── 2. Call the Python ML microservice (with circuit breaker) ────────
    const mlPayload = {
        claim_id,
        user_id:      user.user_id,
        claim_amount,
        claim_type,
        description,
        documents,
        trust_score:  user.trust_score,
    };

    const { fraud_score, ocr_data, doc_match } = await callMLService(mlPayload);

    // ── 3. Evaluate STP rules to determine claim status ─────────────────
    const status = await evaluateStpRules(fraud_score, claim_amount);

    // ── 4. Persist the claim to MongoDB ─────────────────────────────────
    const newClaim = await Claim.create({
        claim_id,
        user_id:      user.user_id,
        claim_amount,
        claim_type,
        description,
        documents:    documents || [],
        fraud_score,
        status,
        ocr_data,
        doc_match,
    });

    return newClaim;
};

/**
 * getUserClaims — fetches all claims belonging to a specific user.
 *
 * @param {string} userId — the custom user_id
 * @returns {Array} array of Claim documents
 */
export const getUserClaims = async (userId) => {
    const claims = await Claim.find({ user_id: userId })
        .sort({ created_at: -1 }) // Newest first
        .select("-__v");

    return claims;
};

/**
 * getClaimById — fetches a single claim by its custom claim_id.
 * Verifies ownership: the requesting user must own the claim (or be admin).
 *
 * @param {string} claimId — the custom claim_id
 * @param {Object} user    — the authenticated user from req.user
 * @returns {Object} Claim document
 */
export const getClaimById = async (claimId, user) => {
    const claim = await Claim.findOne({ claim_id: claimId }).select("-__v");

    if (!claim) {
        throw new ApiError(HTTP.NOT_FOUND, `Claim ${claimId} not found.`);
    }

    // Ownership check: non-admin users can only view their own claims
    if (claim.user_id !== user.user_id && user.role !== 'admin') {
        throw new ApiError(HTTP.FORBIDDEN, "You are not authorized to view this claim.");
    }

    return claim;
};
