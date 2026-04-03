// =============================================================================
// constants.js — BACKWARD-COMPATIBLE RE-EXPORTS
// =============================================================================
// This file exists solely so that `import { DB_NAME } from '../constants.js'`
// (used in db/index.js from Sprint 1) continues to work.
// ALL authoritative definitions live in `./constants/appConstants.js`.
// =============================================================================

export {
    DB_NAME,
    STP_CONFIG_NAME,
    CLAIM_STATUS,
    USER_ROLES,
    CLAIM_CONFIG,
    NETWORK_CONFIG,
    AUTH_CONFIG,
    DEFAULT_STP,
    PAGINATION,
    HTTP,
    USER_CONFIG,
} from './constants/appConstants.js';