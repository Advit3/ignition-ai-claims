// =============================================================================
// auth.service.js — AUTHENTICATION BUSINESS LOGIC
// =============================================================================
// "Fat Service" — all Google OAuth verification and user upsert logic lives
// here. Controllers never touch the DB or third-party APIs directly.
// =============================================================================

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import {
    HTTP,
    AUTH_CONFIG,
    USER_ROLES,
    USER_CONFIG,
} from '../constants/appConstants.js';

// Initialise the Google OAuth2 client with our Client ID from .env
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── HELPER: Generate a unique user_id ──────────────────────────────────────
/**
 * Creates a user_id like "USR-a1b2c3d4" using cryptographic randomness.
 * @returns {string}
 */
const generateUserId = () => {
    const hex = crypto.randomBytes(USER_CONFIG.ID_BYTE_LENGTH).toString('hex');
    return `${USER_CONFIG.ID_PREFIX}${hex}`;
};

// ─── HELPER: Sign a session JWT ─────────────────────────────────────────────
/**
 * Produces a signed JWT containing the user's `user_id` and `role`.
 * @param {Object} user — Mongoose user document
 * @returns {string} signed JWT
 */
const signSessionToken = (user) => {
    return jwt.sign(
        { user_id: user.user_id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: AUTH_CONFIG.JWT_EXPIRY }
    );
};

// =============================================================================
// PUBLIC SERVICE METHODS
// =============================================================================

/**
 * googleLogin — the core "find-or-create" flow.
 *
 * 1. Verify the Google ID token received from the React frontend.
 * 2. Extract the user's profile (name, email, picture) from the payload.
 * 3. Look for an existing user by email.
 *    - Found  → update profile picture (it can change) and return the user.
 *    - Not found → create a new user with a generated user_id and default role.
 * 4. Sign our own session JWT and return it along with the user data.
 *
 * @param {string} googleToken — the ID token from Google Sign-In on the frontend
 * @returns {{ user: Object, token: string }}
 */
export const googleLogin = async (googleToken) => {
    // ── Step 1: Verify the Google token ─────────────────────────────────
    let payload;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: googleToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
    } catch (error) {
        throw new ApiError(
            HTTP.UNAUTHORIZED,
            "Invalid Google token. Authentication failed."
        );
    }

    // ── Step 2: Extract profile from the verified payload ───────────────
    const { email, name, picture } = payload;

    if (!email) {
        throw new ApiError(
            HTTP.BAD_REQUEST,
            "Google account does not have an email address."
        );
    }

    // ── Step 3: Find or Create the user ─────────────────────────────────
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (user) {
        // Existing user — refresh profile picture (Google can change it)
        user.profile_picture = picture || user.profile_picture;
        await user.save();
    } else {
        // Brand-new user — create with defaults from constants
        isNewUser = true;
        user = await User.create({
            user_id:         generateUserId(),
            full_name:       name,
            email:           email,
            profile_picture: picture || "",
            role:            USER_ROLES.POLICYHOLDER,
            trust_score:     AUTH_CONFIG.DEFAULT_TRUST_SCORE,
        });
    }

    // ── Step 4: Mint our own JWT ────────────────────────────────────────
    const token = signSessionToken(user);

    return { user, token, isNewUser };
};

/**
 * getCurrentUser — returns the user document already attached by verifyJWT.
 * Exists as a service method for consistency with the Thin Controller pattern.
 *
 * @param {string} userId — the custom user_id from req.user
 * @returns {Object} Mongoose user document
 */
export const getCurrentUser = async (userId) => {
    const user = await User.findOne({ user_id: userId }).select("-__v");

    if (!user) {
        throw new ApiError(HTTP.NOT_FOUND, "User not found.");
    }

    return user;
};
