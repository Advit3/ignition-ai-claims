// =============================================================================
// User.model.js — USER DOCUMENT SCHEMA
// =============================================================================
// Uses strict snake_case to align with the Python ML dataset.
// Includes refresh_token for secure session rotation and role-based access.
// =============================================================================

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { REFRESH_TOKEN_EXPIRY } from '../constants/appConstants.js';

const userSchema = new mongoose.Schema({
    /** Custom user ID matching ML dataset format (e.g., "USR-a1b2c3d4") */
    user_id: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },

    /** Full name from Google OAuth profile */
    full_name: {
        type: String,
        required: true,
        trim: true,
    },

    /** Email address — unique, lowercase, trimmed */
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },

    /** Google profile picture URL for the frontend */
    profile_picture: {
        type: String,
        default: "",
    },

    /** Role-based access control for the React Dashboard */
    role: {
        type: String,
        enum: ['user', 'policyholder', 'admin', 'adjuster'],
        default: 'user',
    },

    /**
     * Dynamic Trust Engine score (0–100).
     * New users start at 80. Drops on fraudulent claims, rises on clean ones.
     */
    trust_score: {
        type: Number,
        default: 80,
        min: 0,
        max: 100,
    },

    /**
     * SHA-256 hash of the active refresh token.
     * select: false — never returned in queries by default.
     */
    refresh_token: {
        type: String,
        select: false,
    },
}, {
    timestamps: true,
});

// ─── INSTANCE METHOD: Generate a signed refresh token ───────────────────────
/**
 * Signs a refresh token JWT using REFRESH_TOKEN_SECRET and saves its
 * SHA-256 hash to the user document.
 *
 * @returns {string} The raw refresh token (to be set as httpOnly cookie)
 */
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { _id: this._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
};

export const User = mongoose.model('User', userSchema);