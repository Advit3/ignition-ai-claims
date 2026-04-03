// 1. Import the new service at the top of claim.service.js
import { extractClaimData } from "./ocr.service.js";

// ... inside your submitClaim function ...
export const submitClaim = async (claimData) => {
    const { user_id, claim_type, claim_amount, document_url, description } = claimData;
    const claim_id = generateClaimId();
    const requestId = crypto.randomUUID();

    // 🌟 THE INTEGRATION POINT: Call Gemini to read the uploaded document
    const ocrResult = await extractClaimData(document_url);

    // Calculate the Doc Match Score based on OCR findings
    let docMatchScore = 0.5; // Default middle-ground
    if (ocrResult && ocrResult.total_amount) {
        // If the amount on the receipt perfectly matches what the user typed:
        if (Number(ocrResult.total_amount) === Number(claim_amount)) {
            docMatchScore = 1.0; // Perfect match! High trust.
        } else {
            docMatchScore = 0.1; // Amount mismatch! High fraud risk.
        }
    }

    // Now, pass this real data into your fraud builder
    const userHistory = { total_claims: 5, fraud_count: 0, rejected_claims: 1, past_claims: 5, avg_claim_amount: 2500, last_claim_days: 30 };

    const features = buildFeatures({
        claim_amount,
        bill_date: ocrResult?.date_of_service || new Date().toISOString(),
        doc_match_score: docMatchScore // Pass the AI's calculation here
    }, userHistory);

    const rawFraudProbability = predictFraud(features);
    const finalFraudScore = computeFinalRisk(rawFraudProbability, calculateTrustScore(userHistory));

    const claimStatus = await evaluateStpRules(finalFraudScore, claim_amount);

    // Persist claim to Database
    const newClaim = await Claim.create({
        claim_id, user_id, claim_amount, claim_type, document_url, description,
        fraud_score: finalFraudScore,
        claim_status: claimStatus,
        ocr_data: ocrResult || {}, // Save exactly what Gemini found!
        doc_match: docMatchScore,
        ml_request_id: requestId,
    });

    return newClaim;
};