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
        const dt = new Date(billDate);
        if (isNaN(dt.getTime())) return 0.0; // Invalid date format

        const now = new Date();
        // Calculate difference in days
        const deltaDays = Math.floor((now - dt) / (1000 * 60 * 60 * 24));

        if (deltaDays < 0) return 0.0; // Future date (Highly suspicious)
        if (deltaDays > 90) return 0.5; // Older than 3 months
        return 1.0;                     // Recent and valid
    } catch (error) {
        return 0.0;
    }
};

/**
 * Transforms raw claim and user data into a structured feature array.
 */
export const buildFeatures = (claimData, userHistory) => {
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

    return [claimAmount, frequency, amountRatio, finalDocScore, timeGap];
};

/**
 * Simulates the ML Model prediction.
 * In production, Node.js calls the Python Microservice here.
 */
export const predictFraud = (features) => {
    // Cannot load model.pkl in JS directly. 
    // Defaulting to fallback or you would call your Axios Python API here.
    return 0.5;
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
export const computeFinalRisk = (fraudProbability, trustScore) => {
    // Trust score influence is capped to avoid overriding strong fraud signals
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