// =============================================================================
// claim.service.js — CORE CLAIM PROCESSING ENGINE
// =============================================================================
// "Fat Service" — the complete intelligent claims pipeline:
//   1. THE EYES  → OCR Service (Gemini Vision) extracts document data
//   2. THE BRAIN → Fraud Service (feature engineering + trust scoring)
//   3. THE JUDGE → STP Rules Engine (approve / reject / escalate)
//   4. THE RECORD → MongoDB persistence
// No external HTTP calls for ML logic — all services are native Node.js.
// =============================================================================

import crypto from "crypto";
import { Claim } from "../models/claim.model.js";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/logger.js";
import {
    CLAIM_STATUS,
    ALLOWED_TRANSITIONS,
    CLAIM_CONFIG,
    DEFAULT_PAGE,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
} from "../constants/appConstants.js";

// ─── INTEGRATED SERVICE IMPORTS ─────────────────────────────────────────────
import { extractClaimDataFromUrl } from "./ocr.service.js";
import {
    buildFeatures,
    predictFraud,
    calculateTrustScore,
    computeFinalRisk,
} from "./fraud.service.js";
import { makeDecision } from "./decision.service.js";

// ─── HELPER: Generate unique claim_id ───────────────────────────────────────
/**
 * Generates a unique claim identifier like "CLM-a1b2c3".
 * @returns {string}
 */
const generateClaimId = () => {
    const hex = crypto.randomBytes(CLAIM_CONFIG.ID_BYTE_LENGTH).toString("hex");
    return `${CLAIM_CONFIG.ID_PREFIX}${hex}`;
};

// =============================================================================
// PUBLIC SERVICE METHODS
// =============================================================================

/**
 * submitClaim — orchestrates the full intelligent claim processing pipeline.
 *
 * Execution sequence:
 *   1. INITIALIZATION → Generate IDs, extract input fields
 *   2. THE EYES       → OCR extracts data from the document image
 *   3. THE BRAIN      → Fraud feature engineering + ML prediction + trust scoring
 *   4. THE JUDGE      → STP rules engine determines claim_status
 *   5. THE RECORD     → Persist everything to MongoDB
 *
 * @param {Object} claimData — { user_id, claim_type, claim_amount, document_url, description }
 * @returns {Object} saved Claim document
 */
export const submitClaim = async (claimData) => {
    try {
        // =========================================================================
        // STEP 1: INITIALIZATION
        // =========================================================================
        const { user_id, claim_type, claim_amount, document_url, description } = claimData;
        const claim_id = generateClaimId();
        const requestId = crypto.randomUUID();

        logger.info("Pipeline Stage 1/5: INITIALIZATION", { claim_id, user_id });

        // =========================================================================
        // STEP 2: THE "EYES" — OCR Service
        // =========================================================================
        let ocrResult = null;
        try {
            logger.info("Pipeline Stage 2/5: THE EYES — calling OCR service", { claim_id });
            ocrResult = await extractClaimDataFromUrl(document_url);

            // Log the nested structure coming from Python
            logger.info("Parsed OCR Result:", ocrResult);
        } catch (ocrError) {
            logger.warn("Pipeline Stage 2/5: THE EYES — OCR failed", { claim_id, error: ocrError.message });
            ocrResult = null;
        }

        // 🚨 FORGERY CIRCUIT BREAKER
        // If the AI is suspicious, we stop STP immediately and escalate.
        if (ocrResult?.forgery_analysis?.is_suspicious) {
            logger.warn("🚩 FORGERY DETECTED: Escalating to Manual Review", { claim_id });

            return await Claim.create({
                claim_id, user_id, claim_amount, claim_type, document_url, description,
                fraud_score: 1.0,
                claim_status: CLAIM_STATUS.PENDING, // Force Manual Review
                status_reason: `AI Forensics Alert: ${ocrResult.forgery_analysis.reason}`,
                ocr_data: ocrResult,
                doc_match: 0.1,
                ml_request_id: requestId,
            });
        }

        // ── Calculate Doc Match Score (FIXED FOR NESTING) ──────────────────
        let docMatchScore = 0.5;
        const extractedAmount = ocrResult?.data?.total_amount;

        if (extractedAmount !== null && extractedAmount !== undefined) {
            const ocrAmount = parseFloat(extractedAmount);
            const userAmount = parseFloat(claim_amount);

            if (!isNaN(ocrAmount) && !isNaN(userAmount)) {
                // Perfect match within a 1-unit margin of error
                if (Math.abs(userAmount - ocrAmount) < 1) {
                    docMatchScore = 1.0;
                } else if (userAmount < ocrAmount) {
                    docMatchScore = 0.8; // Safe partial/deductible claim
                } else {
                    docMatchScore = 0.1; // Fraudulent over-claim
                }
            }
        }

        // =========================================================================
        // STEP 3: THE "BRAIN" — Fraud Service
        // =========================================================================
        const userHistory = await (async () => {
            const [stats] = await Claim.aggregate([
                { $match: { user_id: String(user_id) } },
                {
                    $group: {
                        _id: null,
                        total_claims: { $sum: 1 },
                        avg_claim_amount: { $avg: "$claim_amount" },
                        last_claim_date: { $max: "$created_at" },
                    },
                },
            ]);

            if (!stats) return { total_claims: 0, avg_claim_amount: claim_amount, last_claim_days: 999 };

            // 🛡️ MATH FAILSAFE: Prevent "Sextillion Rupee" Poisoning
            let saneAvg = stats.avg_claim_amount;
            if (saneAvg > 1000000000) {
                logger.error("☢️ SEXTILLION MATH DETECTED: Using claim_amount as fallback", { saneAvg });
                saneAvg = claim_amount;
            }

            return {
                total_claims: stats.total_claims,
                avg_claim_amount: saneAvg,
                last_claim_days: Math.floor((Date.now() - new Date(stats.last_claim_date)) / 86400000) || 0
            };
        })();

        const features = buildFeatures({ claim_amount, doc_match_score: docMatchScore }, userHistory);
        const rawFraudProbability = predictFraud(features);
        const trustScore = calculateTrustScore(userHistory);
        const finalFraudScore = computeFinalRisk(rawFraudProbability, trustScore);

        // =========================================================================
        // STEP 4 & 5: THE JUDGE & THE RECORD
        // =========================================================================
        const decision = makeDecision(finalFraudScore, trustScore, rawFraudProbability);

        const newClaim = await Claim.create({
            claim_id, user_id, claim_amount, claim_type, document_url, description,
            fraud_score: finalFraudScore,
            claim_status: decision.status,
            status_reason: decision.reason,
            ocr_data: ocrResult || {},
            doc_match: docMatchScore,
            ml_request_id: requestId,
        });

        return newClaim;

    } catch (error) {
        logger.error("FATAL PIPELINE CRASH:", error.stack);
        throw new ApiError(500, "Internal Server Error");
    }
};

/**
 * Fetches a paginated list of claims belonging to a specific user.
 *
 * @param {string} userId - The string user_id of the logged-in user
 * @param {object} queryParams - { page, limit, status } from req.query
 * @returns {object} { claims, total, page, limit, total_pages }
 */
export const getUserClaims = async (userId, queryParams = {}) => {
    const page = Math.max(1, parseInt(queryParams.page) || DEFAULT_PAGE);
    const limit = Math.min(
        MAX_PAGE_SIZE,
        Math.max(1, parseInt(queryParams.limit) || DEFAULT_PAGE_SIZE)
    );
    const skip = (page - 1) * limit;

    const query = { user_id: userId };

    if (queryParams.status && Object.values(CLAIM_STATUS).includes(queryParams.status)) {
        query.claim_status = queryParams.status;
    }

    const [total, claims] = await Promise.all([
        Claim.countDocuments(query),
        Claim.find(query)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .select("-ml_raw_response")
            .lean(),
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

    const claim = await Claim.findOne({ claim_id: claimId });
    if (!claim) {
        throw new ApiError(404, "Claim not found");
    }

    const currentStatus = claim.claim_status;

    const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(newStatus)) {
        throw new ApiError(
            400,
            `Cannot transition claim from "${currentStatus}" to "${newStatus}". ` +
            `Allowed transitions: ${allowedNext.join(", ") || "none"}`
        );
    }

    if (
        (newStatus === CLAIM_STATUS.REJECTED || newStatus === CLAIM_STATUS.ESCALATED)
        && !reason
    ) {
        throw new ApiError(400, `A reason is required when setting status to "${newStatus}"`);
    }

    claim.claim_status = newStatus;
    claim.status_reason = reason || null;
    claim.updated_by = actorId;
    claim.updated_at = new Date();

    await claim.save();

    return claim.toObject();
};

export const verifyBillMath = (ocrData) => {
    // If your OCR extracts subtotal and tax:
    if (ocrData.subtotal + ocrData.tax !== ocrData.total_amount) {
        return { is_math_valid: false, reason: "Bill totals do not sum up correctly." };
    }
    return { is_math_valid: true };
};