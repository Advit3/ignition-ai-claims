// =============================================================================
// auth.middleware.js — JWT VERIFICATION & ROLE-BASED ACCESS CONTROL
// =============================================================================
// Two middlewares:
//   1. verifyJWT  — decodes the Bearer token, attaches req.user
//   2. isAdmin    — gates routes to admin-only users
// =============================================================================

import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import { HTTP, USER_ROLES, AUTH_CONFIG } from '../constants/appConstants.js';

// ─── 1. VERIFY JWT ──────────────────────────────────────────────────────────
/**
 * Extracts the Bearer token from the Authorization header,
 * verifies it against ACCESS_TOKEN_SECRET (or JWT_SECRET fallback),
 * looks up the user in MongoDB, and attaches to req.user.
 */
export const verifyJWT = asyncHandler(async (req, _res, next) => {
    const authHeader = req.header("Authorization");
    const token = authHeader?.startsWith(AUTH_CONFIG.BEARER_PREFIX)
        ? authHeader.slice(AUTH_CONFIG.BEARER_PREFIX.length)
        : null;

    if (!token) {
        throw new ApiError(HTTP.UNAUTHORIZED, "Unauthorized request. No token provided.");
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET
        );

        // Look up by custom user_id (NOT MongoDB _id)
        const user = await User.findOne({ user_id: decoded.user_id }).select("-__v");

        if (!user) {
            throw new ApiError(HTTP.UNAUTHORIZED, "Invalid Access Token. User not found.");
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(HTTP.UNAUTHORIZED, error?.message || "Invalid or expired access token.");
    }
});

// ─── 2. IS ADMIN (RBAC) ────────────────────────────────────────────────────
/**
 * Must be chained AFTER verifyJWT. Checks req.user.role === 'admin'.
 */
export const isAdmin = asyncHandler(async (req, _res, next) => {
    if (!req.user) {
        throw new ApiError(HTTP.UNAUTHORIZED, "Authentication required before authorization check.");
    }

    if (req.user.role !== USER_ROLES.ADMIN) {
        throw new ApiError(HTTP.FORBIDDEN, "Access denied. Admin privileges required.");
    }

    next();
});