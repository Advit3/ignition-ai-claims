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
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

// ─── POST /api/v1/auth/google ───────────────────────────────────────────────
/**
 * Google OAuth Login / Signup
 *
 * Expects: { token: "<Google ID Token>" } in req.body
 * Returns: Access token in body + refresh token as httpOnly cookie
 */

/* ── REAL GOOGLE AUTH (uncomment when Google Client ID is configured) ─────
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
                user_id:         user.user_id,
                full_name:       user.full_name,
                email:           user.email,
                profile_picture: user.profile_picture,
                role:            user.role,
                trust_score:     user.trust_score,
            },
            token: accessToken,
        }, message)
    );
});
── END REAL GOOGLE AUTH ──────────────────────────────────────────────────── */

/**
 * MOCK Google Login — for development/testing without a real Google Client ID.
 * Creates a user with admin role and returns a session JWT + refresh cookie.
 */
export const googleLogin = asyncHandler(async (req, res) => {
    // 1. MOCK: Pretend we verified a real Google token
    const mockGoogleData = {
        sub:     "10293847565544332211",
        email:   "piyush.test@gmail.com",
        name:    "Piyush Adkar",
        picture: "https://lh3.googleusercontent.com/a/mock-photo",
    };

    const { sub: googleId, email, name, picture } = mockGoogleData;

    // 2. REAL DB LOGIC: Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
        user = await User.create({
            user_id:         `U${googleId.substring(0, 8)}`,
            full_name:       name,
            email,
            profile_picture: picture,
            role:            'admin',
            trust_score:     100,
        });
    }

    // 3. REAL JWT LOGIC: Sign access token
    const accessToken = jwt.sign(
        { user_id: user.user_id, _id: user._id, role: user.role },
        process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || "hackathon_secret_123",
        { expiresIn: "1d" }
    );

    // 4. Generate refresh token and set as httpOnly cookie
    const refreshToken = user.generateRefreshToken();
    const crypto = await import('crypto');
    user.refresh_token = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await user.save();

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTIONS);

    // 5. RESPONSE
    return res.status(HTTP.OK).json(
        new ApiResponse(HTTP.OK, {
            user,
            token: accessToken,
        }, "Mock Auth successful")
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
            user_id:         user.user_id,
            full_name:       user.full_name,
            email:           user.email,
            profile_picture: user.profile_picture,
            role:            user.role,
            trust_score:     user.trust_score,
        }, "User profile fetched successfully.")
    );
});