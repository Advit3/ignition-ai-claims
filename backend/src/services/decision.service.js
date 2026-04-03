// =============================================================================
// decision.service.js — STP RULES ENGINE (THE JUDGE)
// =============================================================================
// Reads fraud scores and trust scores and makes the final claim decision.
// All thresholds imported from appConstants.js — no magic numbers here.
// =============================================================================

import logger from "../utils/logger.js";
import { CLAIM_STATUS } from "../constants/appConstants.js";

// STP Decision Thresholds
// These can be overridden by StpConfig from MongoDB in production
const AUTO_APPROVE_THRESHOLD = 0.30; // final_risk below this → auto approved
const AUTO_REJECT_THRESHOLD  = 0.70; // final_risk above this → auto rejected
const MIN_TRUST_FOR_APPROVAL = 0.50; // trust score must be above this to approve

/**
 * Makes the final STP claim decision based on fraud risk and trust score.
 *
 * Decision matrix:
 *   finalRisk < 0.30 AND trustScore > 0.50  → APPROVED  (low risk, trustworthy)
 *   finalRisk > 0.70                         → REJECTED  (high risk regardless of trust)
 *   anything else                            → PENDING   (human review needed)
 *
 * @param {number} finalRisk       - Fused fraud score (0.0 to 1.0)
 * @param {number} trustScore      - User historical trust (0.0 to 1.0)
 * @param {number} fraudProbability - Raw ML fraud probability before trust fusion
 * @returns {{ status: string, reason: string }}
 */
export const makeDecision = (finalRisk, trustScore, fraudProbability) => {
  logger.info("Evaluating STP Decision Matrix...", {
    finalRisk,
    trustScore,
    fraudProbability,
  });

  // ── RULE 1: AUTO APPROVE ──────────────────────────────────────────────────
  if (finalRisk < AUTO_APPROVE_THRESHOLD && trustScore >= MIN_TRUST_FOR_APPROVAL) {
    return {
      status: CLAIM_STATUS.APPROVED,
      reason: `Based on risk (${finalRisk.toFixed(2)}) and trust score (${trustScore.toFixed(2)}) - Risk is within acceptable threshold for automatic approval.`,
    };
  }

  // ── RULE 2: AUTO REJECT ───────────────────────────────────────────────────
  if (finalRisk >= AUTO_REJECT_THRESHOLD) {
    return {
      status: CLAIM_STATUS.REJECTED,
      reason: `Claim automatically rejected due to high fraud risk score (${finalRisk.toFixed(2)}). Raw fraud probability: ${fraudProbability.toFixed(2)}.`,
    };
  }

  // ── RULE 3: SEND TO HUMAN REVIEW (PENDING) ───────────────────────────────
  return {
    status: CLAIM_STATUS.PENDING,
    reason: `Claim requires manual review. Risk score (${finalRisk.toFixed(2)}) is in the borderline zone or trust score (${trustScore.toFixed(2)}) is insufficient for automatic approval.`,
  };
};
