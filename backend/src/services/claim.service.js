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
import { extractClaimData } from "./ocr.service.js";
import {
    buildFeatures,
    predictFraud,
    calculateTrustScore,
    computeFinalRisk,
} from "./fraud.service.js";
import { makeDecision } from "./decision.services.js";

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
        console.log("[TRACE - 1. INITIAL INPUT]", claimData);

        const { user_id, claim_type, claim_amount, document_url, description } = claimData;
        const claim_id = generateClaimId();
        const requestId = crypto.randomUUID();

        logger.info("Pipeline Stage 1/5: INITIALIZATION", {
            claim_id,
            user_id,
            claim_type,
            claim_amount,
            requestId,
        });

        // =========================================================================
        // STEP 2: THE "EYES" — OCR Service (Gemini Vision)
        // =========================================================================
        // Wrapped in try/catch so a bad image never crashes the pipeline.
        // If OCR fails, we continue with defaults — the claim still gets processed.
        let ocrResult = null;
        try {
            logger.info("Pipeline Stage 2/5: THE EYES — calling OCR service", { claim_id });
            ocrResult = await extractClaimData(document_url);

            // 🔍 DEBUG: Log the full parsed OCR result immediately
            logger.info("Parsed OCR Result:", ocrResult);

            logger.info("Pipeline Stage 2/5: THE EYES — OCR complete", {
                claim_id,
                ocr_success: !!ocrResult,
                extracted_amount: ocrResult?.total_amount ?? "N/A",
                provider: ocrResult?.provider_name ?? "N/A",
            });
        } catch (ocrError) {
            logger.warn("Pipeline Stage 2/5: THE EYES — OCR failed, continuing with defaults", {
                claim_id,
                error: ocrError.message,
                stack: ocrError.stack,
            });
            ocrResult = null;
        }

        // ── Calculate Doc Match Score based on OCR findings ──────────────────
        console.log("[TRACE - 2. BEFORE COMPARISON]", {
            typeof_claim_amount: typeof claim_amount,
            typeof_ocr_total_amount: ocrResult ? typeof ocrResult.total_amount : "undefined"
        });

        let docMatchScore = 0.5; // Default middle-ground

        if (ocrResult && ocrResult.total_amount !== null && ocrResult.total_amount !== undefined) {
            // Safe comparison using parseFloat — handles strings, NaN, etc.
            const ocrAmount = parseFloat(ocrResult.total_amount);
            const userAmount = parseFloat(claim_amount);

            if (!isNaN(ocrAmount) && !isNaN(userAmount)) {
                if (userAmount === ocrAmount) {
                    docMatchScore = 1.0; // Perfect match — high trust
                    console.log("[TRACE - 3. DOC MATCH RESULT]", { score: docMatchScore, reason: "Amounts matched exactly" });
                    logger.info("Calculated docMatchScore: 1.0 (PERFECT MATCH)", {
                        claim_id, ocr_amount: ocrAmount, user_amount: userAmount,
                    });
                } else if (userAmount < ocrAmount) {
                    // ✅ NEW RULE: Under-claiming is safe (partial claim / deductible)
                    docMatchScore = 0.8;
                    console.log("[TRACE - 3. DOC MATCH RESULT]", { score: docMatchScore, reason: "Valid under-claim / partial claim" });
                    logger.info(`Calculated docMatchScore: 0.8 (PARTIAL CLAIM) on ${claim_id}: User claimed ${userAmount} for bill of ${ocrAmount}`);
                } else {
                    // 🚨 FRAUD RULE: Over-claiming (Liar!)
                    docMatchScore = 0.1; // Amount mismatch — high fraud risk
                    console.log("[TRACE - 3. DOC MATCH RESULT]", { score: docMatchScore, reason: "Amount mismatch detected (Over-claim)" });
                    logger.warn(`Calculated docMatchScore: 0.1 (OVER-CLAIM) on ${claim_id}! User claimed ${userAmount}, OCR found ${ocrAmount}`);
                }
            } else {
                // Failsafe in case Gemini returns weird text that parseFloat turns into NaN
                docMatchScore = 0.5;
                console.log("[TRACE - 3. DOC MATCH RESULT]", { score: docMatchScore, reason: "Could not parse amounts to valid numbers" });
                logger.warn("Calculated docMatchScore: 0.5 (PARSE FAILED)", { claim_id, ocr_amount: ocrResult.total_amount, user_amount: claim_amount });
            }
        } else {
            console.log("[TRACE - 3. DOC MATCH RESULT]", { score: docMatchScore, reason: "Default - No OCR amount available" });
            logger.info("Calculated docMatchScore: 0.5 (DEFAULT — no OCR amount available)", {
                claim_id,
            });
        }

        // =========================================================================
        // STEP 3: THE "BRAIN" — Fraud Service (Feature Engineering + ML)
        // =========================================================================
        logger.info("Pipeline Stage 3/5: THE BRAIN — running fraud analysis", { claim_id });

        // Mock user history representing database stats
        // TODO: In production, fetch real stats from User + Claim aggregation
        const userHistory = {
            total_claims: 5,
            fraud_count: 0,
            rejected_claims: 1,
            past_claims: 5,
            avg_claim_amount: 2500,
            last_claim_days: 30,
        };

        // Build the ML feature vector
        const features = buildFeatures(
            {
                claim_amount,
                bill_date: ocrResult?.date_of_service || new Date().toISOString(),
                doc_match_score: docMatchScore,
            },
            userHistory
        );

        // Execute the full ML pipeline
        const rawFraudProbability = predictFraud(features);
        const trustScore = calculateTrustScore(userHistory);
        const finalFraudScore = computeFinalRisk(rawFraudProbability, trustScore);

        logger.info("Pipeline Stage 3/5: THE BRAIN — analysis complete", {
            claim_id,
            features,
            raw_fraud_probability: rawFraudProbability,
            trust_score: trustScore,
            final_fraud_score: finalFraudScore,
        });

        // =========================================================================
        // STEP 4: THE "JUDGE" — STP Decision Engine
        // =========================================================================
        logger.info("Pipeline Stage 4/5: THE JUDGE — evaluating decision matrix", { claim_id });

        const decision = makeDecision(finalFraudScore, trustScore, rawFraudProbability);
        const { status: claimStatus, reason } = decision;

        logger.info("Pipeline Stage 4/5: THE JUDGE — verdict rendered", {
            claim_id,
            claim_status: claimStatus,
            stp_reason: reason,
            final_fraud_score: finalFraudScore,
        });

        // =========================================================================
        // STEP 5: THE RECORD — Persist to Database
        // =========================================================================
        logger.info("Pipeline Stage 5/5: THE RECORD — saving to database", { claim_id });

        const dbPayload = {
            claim_id,
            user_id,
            claim_amount,
            claim_type,
            document_url,
            description,
            fraud_score: finalFraudScore,
            claim_status: claimStatus,
            status_reason: reason,
            ocr_data: ocrResult || {},
            doc_match: docMatchScore,
            ml_request_id: requestId,
        };

        console.log("[TRACE - 8. FINAL DB PAYLOAD]", dbPayload);

        const newClaim = await Claim.create(dbPayload);

        logger.info("Pipeline COMPLETE — claim processed successfully", {
            claim_id,
            claim_status: claimStatus,
            fraud_score: finalFraudScore,
            doc_match: docMatchScore,
            requestId,
        });

        return newClaim;

    } catch (error) {
        logger.error("FATAL PIPELINE CRASH:", error.stack);
        throw new ApiError(500, "An internal error occurred during claim processing.");
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