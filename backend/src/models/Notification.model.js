// =============================================================================
// Notification.model.js — IN-APP NOTIFICATION SYSTEM
// =============================================================================
// Stores user notifications triggered by claim status changes, system alerts,
// etc. Includes a static `send()` method for easy creation and a compound
// index for efficient "unread notifications" queries.
// =============================================================================

import mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '../constants/appConstants.js';
import logger from '../utils/logger.js';

const notificationSchema = new mongoose.Schema({
    /** The user who should see this notification */
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },

    /** Notification category — drives icon/color in the frontend */
    type: {
        type: String,
        required: true,
        enum: Object.values(NOTIFICATION_TYPES),
    },

    /** Short headline shown in the notification list */
    title: {
        type: String,
        required: true,
    },

    /** Detailed notification body */
    message: {
        type: String,
        required: true,
    },

    /** Optional reference to the related claim */
    claim_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Claim',
    },

    /** Whether the user has seen/dismissed this notification */
    is_read: {
        type: Boolean,
        default: false,
    },

    /** Timestamp when the user marked it as read */
    read_at: {
        type: Date,
    },

    /** Creation timestamp (no updated_at — notifications are append-only) */
    created_at: {
        type: Date,
        default: Date.now,
    },
});

// ─── Compound index for "get my unread notifications, newest first" ─────────
notificationSchema.index({ user_id: 1, is_read: 1, created_at: -1 });

// ─── STATIC METHOD: send() ──────────────────────────────────────────────────
/**
 * Creates a notification record. Fails silently — notification creation
 * must never crash the main request.
 *
 * @param {Object} params
 * @param {ObjectId} params.user_id  — recipient user's ObjectId
 * @param {string}   params.type     — one of NOTIFICATION_TYPES
 * @param {string}   params.title    — notification headline
 * @param {string}   params.message  — notification body
 * @param {ObjectId} [params.claim_id] — optional related claim
 * @returns {Object|null} The created notification document, or null on error
 */
notificationSchema.statics.send = async function ({ user_id, type, title, message, claim_id }) {
    try {
        const notification = await this.create({
            user_id,
            type,
            title,
            message,
            claim_id: claim_id || undefined,
        });
        return notification;
    } catch (err) {
        logger.error('Failed to create notification', {
            user_id,
            type,
            error: err.message,
        });
        return null;
    }
};

export const Notification = mongoose.model('Notification', notificationSchema);
