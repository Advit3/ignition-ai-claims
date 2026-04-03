// =============================================================================
// appConstants.js — THE SINGLE SOURCE OF TRUTH
// =============================================================================
// Every magic string, number, timeout, and enum in the entire application is
// defined here. Import from this file — NEVER inline a raw value.
// =============================================================================

// ─── DATABASE ────────────────────────────────────────────────────────────────
/** MongoDB database name used by the connection string */
export const DB_NAME = "insuranceSTP";

/** The unique config_name used to locate the global STP rules document */
export const STP_CONFIG_NAME = "global_stp_rules";

// ─── CLAIM STATUSES (maps 1:1 with the Mongoose enum) ───────────────────────
export const CLAIM_STATUS = Object.freeze({
    PENDING:  "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
});

// ─── USER ROLES ──────────────────────────────────────────────────────────────
export const USER_ROLES = Object.freeze({
    POLICYHOLDER: "policyholder",
    ADMIN:        "admin",
});

// ─── CLAIM ID GENERATION ─────────────────────────────────────────────────────
export const CLAIM_CONFIG = Object.freeze({
    /** Prefix prepended to every generated claim_id (e.g., "CLM-a1b2c3") */
    ID_PREFIX:      "CLM-",
    /** Number of random bytes — 3 bytes → 6-char hex string */
    ID_BYTE_LENGTH: 3,
    /** Fallback document type when the frontend doesn't specify one */
    DEFAULT_DOC_TYPE: "receipt",
});

// ─── NETWORK / MICROSERVICE ─────────────────────────────────────────────────
export const NETWORK_CONFIG = Object.freeze({
    /** Maximum milliseconds to wait for the Python ML API before timing out */
    ML_TIMEOUT_MS: 5000,
    /**
     * Fraud score assigned when the Python service is unreachable / crashes.
     * Deliberately high (0.99) so the claim goes to manual review, NOT auto-approved.
     */
    FALLBACK_FRAUD_SCORE: 0.99,
});

// ─── AUTHENTICATION / JWT ────────────────────────────────────────────────────
export const AUTH_CONFIG = Object.freeze({
    /** JWT token lifespan — used in `jwt.sign()` */
    JWT_EXPIRY: "7d",
    /** Prefix stripped from the Authorization header */
    BEARER_PREFIX: "Bearer ",
    /** Default trust score assigned to brand-new users */
    DEFAULT_TRUST_SCORE: 80,
});

// ─── DEFAULT STP THRESHOLDS ─────────────────────────────────────────────────
// Used only for seeding / fallback when no StpConfig document exists yet.
export const DEFAULT_STP = Object.freeze({
    AUTO_APPROVE_THRESHOLD: 0.20,
    AUTO_REJECT_THRESHOLD:  0.85,
    MAX_STP_AMOUNT:         50_000,
});

// ─── PAGINATION ──────────────────────────────────────────────────────────────
export const PAGINATION = Object.freeze({
    /** Default page number when the client doesn't specify */
    DEFAULT_PAGE:  1,
    /** Default number of documents per page */
    DEFAULT_LIMIT: 10,
    /** Absolute ceiling to prevent abuse */
    MAX_LIMIT:     100,
});

// ─── HTTP STATUS CODES (used project-wide for clarity) ──────────────────────
export const HTTP = Object.freeze({
    OK:                  200,
    CREATED:             201,
    BAD_REQUEST:         400,
    UNAUTHORIZED:        401,
    FORBIDDEN:           403,
    NOT_FOUND:           404,
    CONFLICT:            409,
    UNPROCESSABLE:       422,
    INTERNAL_SERVER:     500,
    SERVICE_UNAVAILABLE: 503,
});

// ─── USER ID GENERATION ─────────────────────────────────────────────────────
export const USER_CONFIG = Object.freeze({
    /** Prefix for auto-generated user_id values (e.g., "USR-f4e2a1") */
    ID_PREFIX:      "USR-",
    /** Number of random bytes — 4 bytes → 8-char hex string */
    ID_BYTE_LENGTH: 4,
});
