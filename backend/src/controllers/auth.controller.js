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
import { User } from '../models/user.model.js';
import jwt from 'jsonwebtoken';

// ─── POST /api/v1/auth/google ───────────────────────────────────────────────
/**
 * Google OAuth Login / Signup
 *
 * Expects: { token: "<Google ID Token>" } in req.body
 * Returns: Our own session JWT + user profile
 */

/*export const googleLogin = asyncHandler(async (req, res) => {
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
}); */

export const googleLogin = asyncHandler(async (req, res) => {
    // 1. MOCK: Pretend we verified a real token
    const mockGoogleData = {
        sub: "10293847565544332211", // Fake Google ID
        email: "piyush.test@gmail.com",
        name: "Piyush Adkar",
        picture: "https://lh3.googleusercontent.com/a/mock-photo"
    };

    const { sub: googleId, email, name, picture } = mockGoogleData;

    // 2. REAL DB LOGIC: Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
        // Create new user if they don't exist
        user = await User.create({
            user_id: `U${googleId.substring(0, 8)}`,
            full_name: name,
            email: email,
            profile_picture: picture,
            role: 'admin', // Make yourself admin for testing!
            trust_score: 100
        });
    }

    // 3. REAL JWT LOGIC: Sign the session
    const sessionToken = jwt.sign(
        { user_id: user.user_id, role: user.role },
        process.env.JWT_SECRET || "hackathon_secret_123",
        { expiresIn: "1d" }
    );

    // 4. REAL RESPONSE: Return industry-standard JSON
    return res.status(200).json(
        new ApiResponse(200, {
            user,
            token: sessionToken
        }, "Mock Auth successful")
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
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            profile_picture: user.profile_picture,
            role: user.role,
            trust_score: user.trust_score,
        }, "User profile fetched successfully.")
    );
});