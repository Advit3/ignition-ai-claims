import logger from '../utils/logger.js';

/**
 * STP Decision Engine
 * Contains business logic for overall routing of claims based on risk signals
 * * @param {number} finalRisk - The computed final risk score
 * @param {number} trustScore - The user's historical trust score
 * @param {number} fraudProbability - The raw fraud probability from the ML model
 * @returns {Object} { status: string, reason: string }
 */
export const makeDecision = (finalRisk, trustScore, fraudProbability) => {
    logger.info("Evaluating STP Decision Matrix...", { finalRisk, trustScore, fraudProbability });

    // ==========================================
    // 1. Absolute Fraud Hard-Fails
    // ==========================================
    if (finalRisk > 0.8 && fraudProbability > 0.95) {
        return { status: "rejected", reason: "High fraud probability and final risk exceed safe thresholds" };
    }
    if (finalRisk > 0.8) {
        return { status: "rejected", reason: "Final risk exceeds automatic rejection threshold" };
    }
    if (fraudProbability > 0.95) {
        return { status: "rejected", reason: "Extreme fraud probability detected - automatic rejection" };
    }
    if (fraudProbability > 0.85) {
        return { status: "pending", reason: "High fraud probability - requires manual verification" };
    }

    // ==========================================
    // 2. Dynamic Trust Thresholds
    // ==========================================
    // High-trust users get a slightly more lenient auto-approval threshold
    const approveThreshold = trustScore > 0.8 ? 0.4 : 0.3;

    let status;
    let reason;

    // ==========================================
    // 3. Final Risk Assessment Routing
    // ==========================================
    if (finalRisk < approveThreshold) {
        status = "approved";
        reason = "Risk is within acceptable threshold for automatic approval.";
    } else if (finalRisk < 0.6) {
        status = "pending";
        reason = "Risk is moderate, claim flagged for manual reviewer verification.";
    } else {
        status = "rejected";
        reason = "Risk score exceeds maximum allowable limit for this profile.";
    }

    return {
        status,
        reason: `Based on risk (${finalRisk.toFixed(2)}) and trust score (${trustScore.toFixed(2)}) - ${reason}`
    };
};