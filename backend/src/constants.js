// =============================================================================
// constants.js — BACKWARD-COMPATIBLE RE-EXPORTS
// =============================================================================
// Re-exports everything from appConstants.js so existing imports like
// `import { DB_NAME } from '../constants.js'` continue to work.
// =============================================================================

export {
    DB_NAME,
    STP_CONFIG_NAME,
    CLAIM_STATUS,
    ALLOWED_TRANSITIONS,
    USER_ROLES,
    CLAIM_CONFIG,
    NETWORK_CONFIG,
    AUTH_CONFIG,
    DEFAULT_STP,
    PAGINATION,
    HTTP,
    USER_CONFIG,
    REFRESH_TOKEN_EXPIRY,
    REFRESH_TOKEN_COOKIE,
    ACCESS_TOKEN_EXPIRY,
    ML_RETRY_ATTEMPTS,
    ML_RETRY_DELAY_MS,
    ML_FALLBACK_FRAUD_SCORE,
    ML_REQUEST_TIMEOUT_MS,
    DEFAULT_PAGE,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
    RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_AUTH,
    RATE_LIMIT_MAX_GENERAL,
    AUDIT_ACTIONS,
    NOTIFICATION_TYPES,
    HEALTH_STATUS,
} from './constants/appConstants.js';