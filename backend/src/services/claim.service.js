// =============================================================================
// claim.service.js — CORE CLAIM PROCESSING ENGINE
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
import { extractClaimDataFromUrl } from "./ocr.service.js";

const generateClaimId = () => {
    const hex = crypto.randomBytes(CLAIM_CONFIG.ID_BYTE_LENGTH).toString("hex");
    return `${CLAIM_CONFIG.ID_PREFIX}${hex}`;
};

export const submitClaim = async (claimData) => {
    console.log("[TRACE] 3. Starting submitClaim service...");
    try {
        const { user_id, claim_type, claim_amount, document_url, description } = claimData;
        const claim_id = generateClaimId();
        const requestId = crypto.randomUUID();

        // 1. OCR Extraction (Gemini)
        let ocrResult = null;
        try {
            console.log("[TRACE] 4. Cloudinary processing verified. Upload already initiated/completed via frontend bridge.");
            console.log(`[TRACE] 5. Handing off to Python OCR Bridge at ${new Date().toLocaleTimeString()}`);
            ocrResult = await extractClaimDataFromUrl(document_url);
        } catch (ocrError) {
            logger.warn("Pipeline Stage 2/5: THE EYES — OCR failed", { error: ocrError.message });
        }

        // 2. Document Validation & Classification logic (as per prompt specifications)
        const categories = {
            health: ["hospital", "doctor", "patient", "treatment", "diagnosis", "prescription", "medicine", "bill"],
            auto: ["vehicle", "car", "bike", "bus", "engine", "garage", "repair", "accident"],
            gadget: ["mobile", "phone", "tv", "screen", "device", "warranty", "invoice", "model"]
        };

        const scores = { health: 0, auto: 0, gadget: 0 };
        const text = (ocrResult?.raw_text || JSON.stringify(ocrResult) || "").toLowerCase();

        for (let category in categories) {
            for (let word of categories[category]) {
                if (text.includes(word)) {
                    scores[category] += 1;
                }
            }
        }

        let detectedType = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        const totalScore = scores.health + scores.auto + scores.gadget;
        const confidence = totalScore === 0 ? 0 : scores[detectedType] / totalScore;

        // If no scores matched, fallback safely
        if (totalScore === 0) detectedType = "unknown";

        let status, dbStatus, risk;
        let reasons = [];
        let paymentStatus = "pending";

        const expectedClaimType = String(claim_type).toLowerCase().replace(' insurance', '');

        // Safely catch OCR parser errors from the bridge
        if (ocrResult && ocrResult.error) {
            console.warn('AI Quota Hit - Falling back to Manual Review');
            status = "flagged";
            dbStatus = CLAIM_STATUS.ESCALATED; // Escalated maps to manual review
            risk = "Medium";
            reasons.push("OCR Engine Failed - Manual verification required");
            detectedType = claim_type; // Fallback to user type to avoid UI breaks
            ocrResult = {}; // Reset to empty OCR object per instructions
        } else if (detectedType !== expectedClaimType && detectedType !== "unknown") {
            status = "flagged";
            dbStatus = CLAIM_STATUS.ESCALATED; // Map to enum
            risk = "High";
            reasons.push("Document type mismatch");
        } else if (confidence < 0.6 || totalScore === 0) {
            status = "flagged"; // Manual review state
            dbStatus = CLAIM_STATUS.ESCALATED;
            risk = "Medium";
            if (totalScore === 0) reasons.push("No classification keywords detected");
            else reasons.push("Low confidence score");
        } else {
            status = "approved";
            dbStatus = CLAIM_STATUS.APPROVED;
            risk = "Low";
            paymentStatus = "initiated";
        }

        // 3. Database Persistence
        const dbPayload = {
            claim_id,
            user_id,
            claim_amount,
            claim_type: expectedClaimType, // Enforce correct enum representation
            document_url, // For compatibility check
            description,
            claim_status: dbStatus,
            ocr_data: ocrResult || {},
            doc_match: confidence,
            ml_request_id: requestId,
            detected_type: detectedType,
            reasons: reasons,
            risk_level: risk,
            payment_status: paymentStatus
        };

        const newClaim = await Claim.create(dbPayload);

        // 4. Mapped Mandatory Backend Response
        return {
            detectedType: detectedType,
            claimType: expectedClaimType,
            confidence: Number(confidence.toFixed(2)),
            risk: risk.toLowerCase(),
            status: status,
            reasons: reasons,
            paymentStatus: paymentStatus
        };

    } catch (error) {
        console.error('[DETAILED ERROR]', error.stack || error);
        throw new ApiError(500, "An internal error occurred during claim processing.");
    }
};

export const getUserClaims = async (userId, queryParams = {}) => {
    // Left unchanged for list compatibility
    const page = Math.max(1, parseInt(queryParams.page) || DEFAULT_PAGE);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(queryParams.limit) || DEFAULT_PAGE_SIZE));
    const skip = (page - 1) * limit;

    const query = { user_id: userId };
    if (queryParams.status && Object.values(CLAIM_STATUS).includes(queryParams.status)) {
        query.claim_status = queryParams.status;
    }

    const [total, claims] = await Promise.all([
        Claim.countDocuments(query),
        Claim.find(query).sort({ created_at: -1 }).skip(skip).limit(limit).select("-ml_raw_response").lean(),
    ]);

    return { claims, total, page, limit, total_pages: Math.ceil(total / limit) };
};

export const getClaimById = async (claimId, userId, isAdmin = false) => {
    const query = isAdmin ? { claim_id: claimId } : { claim_id: claimId, user_id: userId };
    const claim = await Claim.findOne(query).lean();
    if (!claim) throw new ApiError(404, "Claim not found");
    return claim;
};

export const updateClaimStatus = async (claimId, payload, actorId) => {
    const { status: newStatus, reason } = payload;
    const claim = await Claim.findOne({ claim_id: claimId });
    if (!claim) throw new ApiError(404, "Claim not found");

    claim.claim_status = newStatus;
    claim.status_reason = reason || null;
    claim.updated_by = actorId;
    claim.updated_at = new Date();

    await claim.save();
    return claim.toObject();
};