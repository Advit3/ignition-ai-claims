// =============================================================================
// auth.service.js — AUTHENTICATION BUSINESS LOGIC
// =============================================================================
// "Fat Service" — Google OAuth, JWT signing, refresh token rotation, logout.
// Controllers never touch the DB or third-party APIs directly.
// =============================================================================

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import {
    HTTP,
    AUTH_CONFIG,
    USER_ROLES,
    USER_CONFIG,
    ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY,
} from '../constants/appConstants.js';

// Initialise the Google OAuth2 client
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

// ─── HELPER: SHA-256 hash ───────────────────────────────────────────────────
/**
 * Hashes a token with SHA-256. Used to store refresh tokens securely.
 * @param {string} token — raw JWT string
 * @returns {string} hex-encoded hash
 */
const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

// ─── HELPER: Sign an access token ───────────────────────────────────────────
/**
 * Produces a short-lived access token (15m) containing user_id and role.
 * @param {Object} user — Mongoose user document
 * @returns {string} signed JWT
 */
const signAccessToken = (user) => {
    return jwt.sign(
        { user_id: user.user_id, _id: user._id, role: user.role },
        process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
};

// ─── HELPER: Sign a refresh token ───────────────────────────────────────────
/**
 * Produces a long-lived refresh token (7d) containing only the user _id.
 * @param {Object} user — Mongoose user document
 * @returns {string} signed JWT
 */
const signRefreshToken = (user) => {
    return jwt.sign(
        { _id: user._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
};

// =============================================================================
// PUBLIC SERVICE METHODS
// =============================================================================

/**
 * googleLogin — the core "find-or-create" flow.
 *
 * 1. Verify the Google ID token.
 * 2. Extract profile (name, email, picture).
 * 3. Find or create user in MongoDB.
 * 4. Generate BOTH access and refresh tokens.
 * 5. Store SHA-256 hash of refresh token in DB.
 * 6. Return user + both tokens.
 *
 * @param {string} googleToken — the ID token from Google Sign-In
 * @returns {{ user: Object, accessToken: string, refreshToken: string, isNewUser: boolean }}
 */
export const googleLogin = async (googleToken) => {
    // ── Step 1: Verify Google token ─────────────────────────────────────
    let payload;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken:  googleToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
    } catch (error) {
        throw new ApiError(HTTP.UNAUTHORIZED, "Invalid Google token. Authentication failed.");
    }

    const { email, name, picture } = payload;

    if (!email) {
        throw new ApiError(HTTP.BAD_REQUEST, "Google account does not have an email address.");
    }

    // ── Step 2: Find or Create user ─────────────────────────────────────
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (user) {
        user.profile_picture = picture || user.profile_picture;
        await user.save();
    } else {
        isNewUser = true;
        user = await User.create({
            user_id:         generateUserId(),
            full_name:       name,
            email,
            profile_picture: picture || "",
            role:            USER_ROLES.USER,
            trust_score:     AUTH_CONFIG.DEFAULT_TRUST_SCORE,
        });
    }

    // ── Step 3: Generate BOTH tokens ────────────────────────────────────
    const accessToken  = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    // ── Step 4: Store refresh token hash in DB ──────────────────────────
    user.refresh_token = hashToken(refreshToken);
    await user.save();

    logger.info('User authenticated via Google OAuth', {
        user_id: user.user_id,
        is_new:  isNewUser,
    });

    return { user, accessToken, refreshToken, isNewUser };
};

/**
 * refreshAccessToken — validates incoming refresh token and rotates both tokens.
 *
 * 1. Verify JWT signature of the refresh token.
 * 2. Find user by decoded _id.
 * 3. Compare SHA-256 hash of incoming token with stored hash.
 * 4. If match → generate new access + refresh tokens (rotation).
 * 5. If mismatch → throw 401 (token reuse detected = potential theft).
 *
 * @param {string} incomingRefreshToken — raw refresh token from cookie
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export const refreshAccessToken = async (incomingRefreshToken) => {
    if (!incomingRefreshToken) {
        throw new ApiError(HTTP.UNAUTHORIZED, "Refresh token is required.");
    }

    // ── Verify signature ────────────────────────────────────────────────
    let decoded;
    try {
        decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(HTTP.UNAUTHORIZED, "Invalid or expired refresh token.");
    }

    // ── Find user (include refresh_token field which is select:false) ───
    const user = await User.findById(decoded._id).select('+refresh_token');

    if (!user) {
        throw new ApiError(HTTP.UNAUTHORIZED, "User not found. Token invalid.");
    }

    // ── Compare hashes ──────────────────────────────────────────────────
    const incomingHash = hashToken(incomingRefreshToken);
    if (user.refresh_token !== incomingHash) {
        // Potential token theft — invalidate all sessions
        user.refresh_token = null;
        await user.save();
        logger.warn('Refresh token reuse detected — all sessions invalidated', {
            user_id: user.user_id,
        });
        throw new ApiError(HTTP.UNAUTHORIZED, "Invalid or expired refresh token.");
    }

    // ── Rotate tokens ───────────────────────────────────────────────────
    const newAccessToken  = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    user.refresh_token = hashToken(newRefreshToken);
    await user.save();

    logger.info('Access token refreshed', { user_id: user.user_id });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

/**
 * logoutUser — invalidates the refresh token by clearing it from DB.
 *
 * @param {string} userId — MongoDB _id of the user
 */
export const logoutUser = async (userId) => {
    await User.findByIdAndUpdate(userId, { refresh_token: null });
    logger.info('User logged out', { userId });
};

/**
 * getCurrentUser — returns the user document by custom user_id.
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
