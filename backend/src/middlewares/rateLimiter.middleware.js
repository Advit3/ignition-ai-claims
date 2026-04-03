// =============================================================================
// rateLimiter.middleware.js — API RATE LIMITING
// =============================================================================
// Two limiters with different thresholds:
//   1. authLimiter   — stricter, for /api/v1/auth/* routes
//   2. generalLimiter — standard, for all other routes
// =============================================================================

import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError.js';
import {
    HTTP,
    RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_AUTH,
    RATE_LIMIT_MAX_GENERAL,
} from '../constants/appConstants.js';

/**
 * Custom handler that throws an ApiError instead of sending a raw response.
 * This ensures rate limit errors flow through our global error handler.
 */
const rateLimitHandler = (_req, _res) => {
    throw new ApiError(
        HTTP.TOO_MANY_REQUESTS,
        "Too many requests. Please try again later."
    );
};

// ─── AUTH ROUTE LIMITER (stricter) ──────────────────────────────────────────
/**
 * Rate limiter for authentication routes.
 * Window: 15 minutes, Max: 20 requests per IP.
 */
export const authLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max:      RATE_LIMIT_MAX_AUTH,
    standardHeaders: true,
    legacyHeaders:   false,
    handler:  rateLimitHandler,
});

// ─── GENERAL ROUTE LIMITER ──────────────────────────────────────────────────
/**
 * Rate limiter for all non-auth API routes.
 * Window: 15 minutes, Max: 100 requests per IP.
 */
export const generalLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max:      RATE_LIMIT_MAX_GENERAL,
    standardHeaders: true,
    legacyHeaders:   false,
    handler:  rateLimitHandler,
});
