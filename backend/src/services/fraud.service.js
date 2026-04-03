// =============================================================================
// fraud.service.js — FRAUD FEATURE ENGINEERING & TRUST SCORING
// =============================================================================

/**
 * Validates the bill date and assigns a penalty score based on age.
 * @param {string} billDate - "YYYY-MM-DD"
 * @returns {number} 0.0 to 1.0
 */
export const validateDateScore = (billDate) => {
  if (!billDate) return 0.0;

  try {
    let dt;

    // Check if it's DD-MM-YYYY format (what Gemini returns)
    const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/.exec(billDate);
    if (ddmmyyyy) {
      // Parse manually: day=ddmmyyyy[1], month=ddmmyyyy[2]-1, year=ddmmyyyy[3]
      dt = new Date(
        parseInt(ddmmyyyy[3]),   // year
        parseInt(ddmmyyyy[2]) - 1, // month (0-indexed)
        parseInt(ddmmyyyy[1])    // day
      );
    } else {
      // Fallback: treat as ISO string (e.g. "2026-04-03T20:03:27.724Z")
      dt = new Date(billDate);
    }

    if (isNaN(dt.getTime())) return 0.0; // Still invalid after both attempts

    const now = new Date();
    const deltaDays = Math.floor((now - dt) / (1000 * 60 * 60 * 24));

    if (deltaDays < 0)   return 0.0; // Future date — suspicious
    if (deltaDays > 90)  return 0.5; // Older than 3 months — reduced trust
    return 1.0;                       // Recent and valid

  } catch (error) {
    return 0.0;
  }
};

/**
 * Transforms raw claim and user data into a structured feature array.
 */
export const buildFeatures = (claimData, userHistory) => {
    console.log("[TRACE - ML 1. BUILD FEATURES INPUT]", { claimData, userHistory });
    const claimAmount = claimData.claim_amount || 0.0;
    const frequency = userHistory.past_claims || 0;
    const avgClaimAmount = userHistory.avg_claim_amount || 0.0;

    // Safe division for amount_ratio
    let amountRatio = 0.0;
    if (avgClaimAmount > 0) {
        amountRatio = claimAmount / avgClaimAmount;
    } else {
        amountRatio = claimAmount > 0 ? 1.0 : 0.0;
    }

    const dateScore = validateDateScore(claimData.bill_date);
    const docMatchScore = claimData.doc_match_score || 0.0;
    const finalDocScore = docMatchScore * dateScore;

    const timeGap = userHistory.last_claim_days || 0;

    const features = [claimAmount, frequency, amountRatio, finalDocScore, timeGap];
    console.log("[TRACE - ML 2. BUILD FEATURES OUTPUT]", features);
    return features;
};

/**
 * Simulates the ML Model prediction.
 * In production, Node.js calls the Python Microservice here.
 */
/**
 * Simulates the ML Model prediction using a Rules-Based Heuristic for the hackathon.
 */
export const predictFraud = (features) => {
    console.log("[TRACE - ML 3. PREDICT INPUT]", features);
    // Unpack the features array we built earlier
    // features = [claimAmount, frequency, amountRatio, finalDocScore, timeGap]
    const [rawClaimAmount, frequency, rawAmountRatio, rawFinalDocScore, timeGap] = features;

    // Safely parse to ensure docMatchScore and amountRatio do not become NaN
    const claimAmount = isNaN(rawClaimAmount) ? 0 : Number(rawClaimAmount);
    const amountRatio = isNaN(rawAmountRatio) ? 0 : Number(rawAmountRatio);
    const finalDocScore = isNaN(rawFinalDocScore) ? 0 : Number(rawFinalDocScore);

    let simulatedRisk = 0.1; // Base risk for a standard claim

    // 🚩 FLAG 1: The "Liar" Penalty (OCR Mismatch)
    // If the doc_match_score is terrible (e.g., 0.1), spike the risk massively.
    if (finalDocScore < 0.5) {
        simulatedRisk += 0.70;
        console.log("[TRACE - ML FLAG] Liar penalty applied! +0.70");
        console.log("🚩 ML ALERT: OCR Document Mismatch Detected!");
    }

    // 🚩 FLAG 2: The "Anomaly" Penalty
    // If they are claiming 80x their usual average amount (amountRatio)
    if (amountRatio > 10.0) {
        simulatedRisk += 0.40;
        console.log("[TRACE - ML FLAG] Anomaly penalty applied! >10.0 +0.40");
        console.log("🚩 ML ALERT: Claim amount is abnormally high for this user.");
    } else if (amountRatio > 3.0) {
        simulatedRisk += 0.15;
        console.log("[TRACE - ML FLAG] Anomaly penalty applied! >3.0 +0.15");
    }

    // 🚩 FLAG 3: High-Value Risk
    if (claimAmount > 50000) {
        simulatedRisk += 0.20;
        console.log("[TRACE - ML FLAG] High-Value Risk applied! +0.20");
    }

    // Ensure the final probability stays between 0.0 (Perfect) and 1.0 (Definite Fraud)
    const finalProb = Math.min(1.0, Math.max(0.0, simulatedRisk));
    console.log("[TRACE - ML 4. FINAL RAW RISK]", finalProb);
    return finalProb;
};

/**
 * Calculates a historical trust score for the user.
 */
export const calculateTrustScore = (userHistory) => {
    const totalClaims = userHistory.total_claims || 0;
    const fraudCount = userHistory.fraud_count || 0;
    const rejectedClaims = userHistory.rejected_claims || 0;

    // Handle divide by zero safely
    if (totalClaims === 0) return 1.0;

    const reduction = (fraudCount / totalClaims) * 0.6 + (rejectedClaims / totalClaims) * 0.4;
    const trustScore = 1.0 - reduction;

    // Clamp between 0.0 and 1.0
    return Math.max(0.0, Math.min(1.0, trustScore));
};

/**
 * Fuses the ML fraud probability with the user's historical trust score.
 */
/**
 * Fuses the ML fraud probability with the user's historical trust score.
 */
export const computeFinalRisk = (fraudProbability, trustScore) => {
    // 🛑 THE "HARD FAIL" RULE:
    // If the raw fraud probability is massive (e.g., they failed the OCR check),
    // do NOT let their good history save them. 
    if (fraudProbability >= 0.75) {
        console.log("🛑 TRUST BYPASS: Blatant fraud detected. Trust score ignored.");
        return fraudProbability; // Return the raw 0.80+ score!
    }

    // Otherwise, apply the trust score discount for borderline claims
    const trustImpact = 0.7 * trustScore;
    const adjustedScore = fraudProbability * (1.0 - trustImpact);

    return adjustedScore;
};

// =============================================================================
// LOCAL TESTING BLOCK (Equivalent to if __name__ == "__main__")
// =============================================================================

// This code only runs if you execute this file directly via `node fraud.service.js`
if (process.argv[1].endsWith("fraud.service.js")) {
    const formatDate = (date) => date.toISOString().split('T')[0];

    const now = new Date();
    const todayStr = formatDate(now);

    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + 10);
    const futureStr = formatDate(futureDate);

    const oldDate = new Date(now);
    oldDate.setDate(now.getDate() - 100);
    const oldStr = formatDate(oldDate);

    const sampleUserHistory = {
        past_claims: 5,
        avg_claim_amount: 2500.0,
        last_claim_days: 120,
        fraud_count: 0,
        rejected_claims: 1,
        total_claims: 5
    };

    console.log("--- Testing Valid Date ---");
    const sampleClaimValid = {
        claim_amount: 5000.0,
        doc_match_score: 0.85,
        bill_date: todayStr
    };
    const featuresValid = buildFeatures(sampleClaimValid, sampleUserHistory);
    console.log("Date Score:", validateDateScore(todayStr));
    console.log("Final Doc Score:", featuresValid[3]);

    console.log("\n--- Testing Old Date ---");
    const sampleClaimOld = {
        claim_amount: 5000.0,
        doc_match_score: 0.85,
        bill_date: oldStr
    };
    const featuresOld = buildFeatures(sampleClaimOld, sampleUserHistory);
    console.log("Date Score:", validateDateScore(oldStr));
    console.log("Final Doc Score:", featuresOld[3]);

    console.log("\n--- Testing Future Date ---");
    const sampleClaimFuture = {
        claim_amount: 5000.0,
        doc_match_score: 0.85,
        bill_date: futureStr
    };
    const featuresFuture = buildFeatures(sampleClaimFuture, sampleUserHistory);
    console.log("Date Score:", validateDateScore(futureStr));
    console.log("Final Doc Score:", featuresFuture[3]);

    console.log("\n--- Full Pipeline Check (Using Valid Profile) ---");
    const fraudProb = predictFraud(featuresValid);
    console.log("Features:", featuresValid);
    console.log("Fraud Probability:", fraudProb);

    const trustScore = calculateTrustScore(sampleUserHistory);
    console.log("Trust Score:", trustScore);

    const adjustedScore = computeFinalRisk(fraudProb, trustScore);
    console.log("Adjusted Score:", adjustedScore);
}