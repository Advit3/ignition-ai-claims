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

// ─── CLAIM STATUSES (maps 1:1 with the Mongoose enum + state machine) ───────
export const CLAIM_STATUS = Object.freeze({
    PENDING:   "pending",
    APPROVED:  "approved",
    REJECTED:  "rejected",
    ESCALATED: "escalated",
    REOPENED:  "reopened",
});

// ─── CLAIM STATE MACHINE — allowed transitions ─────────────────────────────
export const ALLOWED_TRANSITIONS = Object.freeze({
    pending:   ["approved", "rejected", "escalated"],
    approved:  ["reopened"],
    rejected:  ["reopened"],
    escalated: ["approved", "rejected"],
    reopened:  ["approved", "rejected", "escalated"],
});

// ─── USER ROLES ──────────────────────────────────────────────────────────────
export const USER_ROLES = Object.freeze({
    USER:         "user",
    POLICYHOLDER: "policyholder", // backward compatibility with Sprint 1 data
    ADMIN:        "admin",
    ADJUSTER:     "adjuster",
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

// ─── NETWORK / MICROSERVICE (legacy group — kept for backward compat) ───────
export const NETWORK_CONFIG = Object.freeze({
    ML_TIMEOUT_MS:       8000,
    FALLBACK_FRAUD_SCORE: 0.85,
});

// ─── ML SERVICE (individual constants for fine-grained imports) ──────────────
/** Number of retries before engaging the circuit-breaker fallback */
export const ML_RETRY_ATTEMPTS       = 3;
/** Base exponential backoff delay in ms (doubles each retry) */
export const ML_RETRY_DELAY_MS       = 500;
/** Fraud score assigned when ALL retries fail or ML is unreachable */
export const ML_FALLBACK_FRAUD_SCORE = 0.85;
/** Hard timeout per attempt in ms */
export const ML_REQUEST_TIMEOUT_MS   = 8000;

// ─── AUTHENTICATION / JWT ────────────────────────────────────────────────────
export const AUTH_CONFIG = Object.freeze({
    /** Access token lifespan — short for security */
    JWT_EXPIRY:    "15m",
    /** Prefix stripped from the Authorization header */
    BEARER_PREFIX: "Bearer ",
    /** Default trust score for newly registered users */
    DEFAULT_TRUST_SCORE: 80,
});

/** Refresh token lifespan (long-lived, stored in httpOnly cookie) */
export const REFRESH_TOKEN_EXPIRY  = "7d";
/** Name of the httpOnly cookie holding the refresh token */
export const REFRESH_TOKEN_COOKIE  = "refresh_token";
/** Access token lifespan (mirrors AUTH_CONFIG.JWT_EXPIRY for direct import) */
export const ACCESS_TOKEN_EXPIRY   = "15m";

// ─── DEFAULT STP THRESHOLDS ─────────────────────────────────────────────────
export const DEFAULT_STP = Object.freeze({
    AUTO_APPROVE_THRESHOLD: 0.20,
    AUTO_REJECT_THRESHOLD:  0.85,
    MAX_STP_AMOUNT:         50_000,
});

// ─── PAGINATION (grouped object — kept for backward compat) ─────────────────
export const PAGINATION = Object.freeze({
    DEFAULT_PAGE:  1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT:     100,
});

/** Standalone pagination constants for direct import */
export const DEFAULT_PAGE      = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE     = 100;

// ─── RATE LIMITING ───────────────────────────────────────────────────────────
/** Sliding window duration in ms (15 minutes) */
export const RATE_LIMIT_WINDOW_MS   = 15 * 60 * 1000;
/** Max requests on auth routes per window */
export const RATE_LIMIT_MAX_AUTH    = 20;
/** Max requests on general routes per window */
export const RATE_LIMIT_MAX_GENERAL = 100;

// ─── HTTP STATUS CODES ──────────────────────────────────────────────────────
export const HTTP = Object.freeze({
    OK:                  200,
    CREATED:             201,
    BAD_REQUEST:         400,
    UNAUTHORIZED:        401,
    FORBIDDEN:           403,
    NOT_FOUND:           404,
    CONFLICT:            409,
    UNPROCESSABLE:       422,
    TOO_MANY_REQUESTS:   429,
    INTERNAL_SERVER:     500,
    SERVICE_UNAVAILABLE: 503,
});

// ─── USER ID GENERATION ─────────────────────────────────────────────────────
export const USER_CONFIG = Object.freeze({
    ID_PREFIX:      "USR-",
    ID_BYTE_LENGTH: 4,
});

// ─── AUDIT LOG ACTIONS ──────────────────────────────────────────────────────
export const AUDIT_ACTIONS = Object.freeze({
    CLAIM_SUBMITTED:      "claim_submitted",
    CLAIM_STATUS_CHANGED: "claim_status_changed",
    STP_CONFIG_UPDATED:   "stp_config_updated",
    USER_ROLE_CHANGED:    "user_role_changed",
    CLAIM_REASSIGNED:     "claim_reassigned",
});

// ─── NOTIFICATION TYPES ─────────────────────────────────────────────────────
export const NOTIFICATION_TYPES = Object.freeze({
    CLAIM_APPROVED:  "claim_approved",
    CLAIM_REJECTED:  "claim_rejected",
    CLAIM_PENDING:   "claim_pending",
    CLAIM_ESCALATED: "claim_escalated",
    SYSTEM_ALERT:    "system_alert",
});

// ─── HEALTH CHECK STATUSES ──────────────────────────────────────────────────
export const HEALTH_STATUS = Object.freeze({
    HEALTHY:   "healthy",
    DEGRADED:  "degraded",
    UNHEALTHY: "unhealthy",
});
