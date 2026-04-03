// =============================================================================
// mlServiceContract.js — ML MICROSERVICE API CONTRACT
// =============================================================================
// Defines the exact request and response shape expected when communicating
// with the Python ML microservice. The ML team must implement endpoints
// matching this contract exactly.
// =============================================================================

/**
 * Request payload sent from Node.js backend to the Python ML service.
 * All fields use snake_case to match the ML dataset schema.
 */
export const ML_REQUEST_SCHEMA = {
    claim_id:     "string  (our generated CLM-xxxxxx ID)",
    claim_type:   "string  (health | car | ecommerce)",
    claim_amount: "number  (dollar amount being claimed)",
    document_url: "string  (Cloudinary URL of the uploaded document)",
    description:  "string|null (free-text claim description)",
    request_id:   "string  (UUID v4 for distributed tracing — from X-Request-Id header)",
};

/**
 * Response payload expected from the Python ML service.
 * The Node.js backend destructures this to populate Claim fields.
 */
export const ML_RESPONSE_SCHEMA = {
    fraud_score: "float   between 0.0 and 1.0 (probability of fraud)",
    ocr_data: {
        extracted_text:  "string  (raw text extracted from the document)",
        confidence:      "float   between 0.0 and 1.0 (OCR confidence)",
        detected_fields: "object  (key-value pairs: bill_amount, date, hospital, etc.)",
    },
    anomaly_flags: "string[] (list of detected anomaly codes, e.g. ['AMOUNT_MISMATCH', 'DUPLICATE_CLAIM'])",
    processing_ms: "number   (ML processing time in milliseconds)",
};

/**
 * ML service endpoint paths.
 * Concatenated with process.env.ML_SERVICE_URL to form the full URL.
 */
export const ML_ENDPOINTS = {
    /** POST — Analyze a claim (main inference endpoint) */
    ANALYZE_CLAIM: "/api/v1/analyze",
    /** GET — Health check for the ML service (used by readiness probe) */
    HEALTH:        "/health",
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NOTE FOR ML TEAM:
 *
 * 1. The Node.js backend sends a POST to ML_ENDPOINTS.ANALYZE_CLAIM
 *    with the body matching ML_REQUEST_SCHEMA.
 *
 * 2. The ML service must respond with HTTP 200 and a body matching
 *    ML_RESPONSE_SCHEMA.
 *
 * 3. On error, respond with HTTP 500 and: { error: "string description" }
 *
 * 4. Every request includes an X-Request-Id header — include this in
 *    ALL ML service logs for end-to-end distributed tracing.
 *
 * 5. The /health endpoint should return HTTP 200 { status: "ok" } when
 *    the model is loaded and ready to serve predictions.
 * ═══════════════════════════════════════════════════════════════════════════
 */
