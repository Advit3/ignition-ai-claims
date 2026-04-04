// =============================================================================
// auth.controller.js — THIN AUTHENTICATION CONTROLLER
// =============================================================================
// Handles HTTP concerns only: validate input, call service, format response.
// Includes mock login for development and real Google OAuth flow.
// =============================================================================

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP, REFRESH_TOKEN_COOKIE } from '../constants/appConstants.js';
import * as authService from '../services/auth.service.js';
import { User } from '../models/user.model.js';
import jwt from 'jsonwebtoken';

// ─── Cookie options for refresh token ───────────────────────────────────────
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

// ─── POST /api/v1/auth/google ───────────────────────────────────────────────
/**
 * Google OAuth Login / Signup
 *
 * Expects: { token: "<Google ID Token>" } in req.body
 * Returns: Access token in body + refresh token as httpOnly cookie
 */


export const googleLogin = asyncHandler(async (req, res) => {
    const { token, google_token } = req.body;
    const googleToken = google_token || token;

    if (!googleToken) {
        throw new ApiError(HTTP.BAD_REQUEST, "Google token is required.");
    }

    const { user, accessToken, refreshToken, isNewUser } = await authService.googleLogin(googleToken);

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTIONS);

    const statusCode = isNewUser ? HTTP.CREATED : HTTP.OK;
    const message = isNewUser
        ? "Account created and logged in successfully."
        : "Logged in successfully.";

    return res.status(statusCode).json(
        new ApiResponse(statusCode, {
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                profile_picture: user.profile_picture,
                role: user.role,
                trust_score: user.trust_score,
            },
            token: accessToken,
        }, message)
    );
});



// ─── POST /api/v1/auth/refresh ──────────────────────────────────────────────
/**
 * Refresh Access Token
 *
 * Reads the refresh token from the httpOnly cookie, verifies it,
 * rotates both tokens, and returns a new access token.
 */
export const refreshToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!incomingRefreshToken) {
        throw new ApiError(HTTP.UNAUTHORIZED, "Refresh token not found in cookies.");
    }

    const { accessToken, refreshToken: newRefreshToken } =
        await authService.refreshAccessToken(incomingRefreshToken);

    // Set the new rotated refresh token as cookie
    res.cookie(REFRESH_TOKEN_COOKIE, newRefreshToken, COOKIE_OPTIONS);

    return res.status(HTTP.OK).json(
        new ApiResponse(HTTP.OK, { token: accessToken }, "Access token refreshed successfully.")
    );
});

// ─── POST /api/v1/auth/logout ───────────────────────────────────────────────
/**
 * Logout — invalidates refresh token and clears the cookie.
 */
export const logout = asyncHandler(async (req, res) => {
    await authService.logoutUser(req.user._id);

    res.clearCookie(REFRESH_TOKEN_COOKIE, COOKIE_OPTIONS);

    return res.status(HTTP.OK).json(
        new ApiResponse(HTTP.OK, null, "Logged out successfully.")
    );
});

// ─── GET /api/v1/auth/me ────────────────────────────────────────────────────
/**
 * Get Current User Profile (Protected)
 */
export const getMe = asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.user.user_id);

    return res.status(HTTP.OK).json(
        new ApiResponse(HTTP.OK, {
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            profile_picture: user.profile_picture,
            role: user.role,
            trust_score: user.trust_score,
        }, "User profile fetched successfully.")
    );
});