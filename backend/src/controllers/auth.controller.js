// =============================================================================
// auth.controller.js — THIN AUTHENTICATION CONTROLLER
// =============================================================================
// Handles only HTTP concerns: validate input, call the service, format response.
// All business logic lives in auth.service.js.
// =============================================================================

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP } from '../constants/appConstants.js';
import * as authService from '../services/auth.service.js';

// ─── POST /api/v1/auth/google ───────────────────────────────────────────────
/**
 * Google OAuth Login / Signup
 *
 * Expects: { token: "<Google ID Token>" } in req.body
 * Returns: Our own session JWT + user profile
 */
export const googleLogin = asyncHandler(async (req, res) => {
    const { token } = req.body;

    // ── Input validation (controller responsibility) ────────────────────
    if (!token) {
        throw new ApiError(
            HTTP.BAD_REQUEST,
            "Google token is required in the request body."
        );
    }

    // ── Delegate to service ─────────────────────────────────────────────
    const { user, token: sessionToken, isNewUser } = await authService.googleLogin(token);

    // ── Format & send response ──────────────────────────────────────────
    const statusCode = isNewUser ? HTTP.CREATED : HTTP.OK;
    const message = isNewUser
        ? "Account created and logged in successfully."
        : "Logged in successfully.";

    return res.status(statusCode).json(
        new ApiResponse(statusCode, {
            user: {
                user_id:         user.user_id,
                full_name:       user.full_name,
                email:           user.email,
                profile_picture: user.profile_picture,
                role:            user.role,
                trust_score:     user.trust_score,
            },
            token: sessionToken,
        }, message)
    );
});

// ─── GET /api/v1/auth/me ────────────────────────────────────────────────────
/**
 * Get Current User Profile (Protected)
 *
 * Uses the user_id from req.user (set by verifyJWT middleware)
 */
export const getMe = asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.user.user_id);

    return res.status(HTTP.OK).json(
        new ApiResponse(HTTP.OK, {
            user_id:         user.user_id,
            full_name:       user.full_name,
            email:           user.email,
            profile_picture: user.profile_picture,
            role:            user.role,
            trust_score:     user.trust_score,
        }, "User profile fetched successfully.")
    );
});