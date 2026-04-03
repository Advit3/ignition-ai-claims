// =============================================================================
// notification.service.js — NOTIFICATION & EMAIL SERVICE
// =============================================================================
// Fire-and-forget notifications — both in-app (MongoDB) and email (Nodemailer).
// Failures are logged but NEVER crash the main request.
// =============================================================================

import nodemailer from 'nodemailer';
import { Notification } from '../models/Notification.model.js';
import logger from '../utils/logger.js';
import { NOTIFICATION_TYPES, DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, HTTP } from '../constants/appConstants.js';
import { ApiError } from '../utils/ApiError.js';

// ─── Email transporter (lazy-initialized) ───────────────────────────────────
let transporter = null;

/**
 * Returns a configured Nodemailer transporter. Creates it once.
 * @returns {import('nodemailer').Transporter|null}
 */
const getTransporter = () => {
    if (transporter) return transporter;

    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
        logger.warn('Email config not set — emails will be skipped');
        return null;
    }

    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10) || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    return transporter;
};

// ─── Email templates by notification type ───────────────────────────────────
const EMAIL_SUBJECTS = {
    [NOTIFICATION_TYPES.CLAIM_APPROVED]:  '✅ Your Insurance Claim Has Been Approved',
    [NOTIFICATION_TYPES.CLAIM_REJECTED]:  '❌ Your Insurance Claim Has Been Rejected',
    [NOTIFICATION_TYPES.CLAIM_PENDING]:   '⏳ Your Insurance Claim Is Under Review',
    [NOTIFICATION_TYPES.CLAIM_ESCALATED]: '⚠️ Your Insurance Claim Has Been Escalated',
    [NOTIFICATION_TYPES.SYSTEM_ALERT]:    '🔔 System Notification',
};

/**
 * Builds a simple HTML email body.
 * @param {Object} payload
 * @returns {string} HTML string
 */
const buildEmailBody = ({ title, message, type }) => {
    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Insurance Claim Update</h1>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-top: 0;">${title}</h2>
            <p style="font-size: 15px;">${message}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #888;">
                This is an automated notification from the Insurance STP platform.
                Please do not reply to this email.
            </p>
        </div>
    </body>
    </html>`;
};

/**
 * Sends an email notification. Fails silently.
 * @param {Object} payload — { type, title, message, userEmail }
 */
const sendEmail = async ({ type, title, message, userEmail }) => {
    const transport = getTransporter();
    if (!transport || !userEmail) return;

    try {
        await transport.sendMail({
            from:    process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to:      userEmail,
            subject: EMAIL_SUBJECTS[type] || 'Insurance Claim Notification',
            html:    buildEmailBody({ title, message, type }),
        });
        logger.info('Email sent', { to: userEmail, type });
    } catch (err) {
        logger.error('Email send failed', { to: userEmail, error: err.message });
    }
};

// =============================================================================
// PUBLIC SERVICE METHODS
// =============================================================================

/**
 * sendNotification — creates an in-app notification AND sends an email.
 * Both operations are fire-and-forget — never crash the main request.
 *
 * @param {Object} payload
 * @param {ObjectId} payload.user_id   — recipient user's ObjectId
 * @param {string}   payload.type      — one of NOTIFICATION_TYPES
 * @param {string}   payload.title     — notification headline
 * @param {string}   payload.message   — notification body
 * @param {ObjectId} [payload.claim_id] — optional related claim
 * @param {string}   [payload.userEmail] — email address for email notification
 */
export const sendNotification = async (payload) => {
    try {
        // In-app notification
        await Notification.send({
            user_id:  payload.user_id,
            type:     payload.type,
            title:    payload.title,
            message:  payload.message,
            claim_id: payload.claim_id,
        });

        // Email notification
        await sendEmail(payload);
    } catch (err) {
        // Silently swallow — notification failure must not affect claim flow
        logger.error('Notification failed', { err: err.message, payload: { type: payload.type } });
    }
};

/**
 * getUserNotifications — paginated fetch of notifications for a user.
 *
 * @param {ObjectId} userId — user's MongoDB _id
 * @param {Object}   query  — { page, limit, is_read }
 * @returns {{ notifications, total, page, limit, total_pages }}
 */
export const getUserNotifications = async (userId, query = {}) => {
    const page  = Math.max(1, parseInt(query.page, 10)  || DEFAULT_PAGE);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE));
    const skip  = (page - 1) * limit;

    const filter = { user_id: userId };
    if (query.is_read !== undefined) {
        filter.is_read = query.is_read === 'true';
    }

    const [notifications, total] = await Promise.all([
        Notification.find(filter)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .select('-__v'),
        Notification.countDocuments(filter),
    ]);

    return {
        notifications,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
    };
};

/**
 * markAsRead — marks a single notification as read.
 *
 * @param {string}   notificationId — MongoDB _id
 * @param {ObjectId} userId         — must own the notification
 * @returns {Object} updated notification
 */
export const markAsRead = async (notificationId, userId) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user_id: userId },
        { $set: { is_read: true, read_at: new Date() } },
        { new: true }
    );

    if (!notification) {
        throw new ApiError(HTTP.NOT_FOUND, "Notification not found.");
    }

    return notification;
};

/**
 * markAllAsRead — marks all unread notifications as read for a user.
 *
 * @param {ObjectId} userId
 * @returns {{ modified_count: number }}
 */
export const markAllAsRead = async (userId) => {
    const result = await Notification.updateMany(
        { user_id: userId, is_read: false },
        { $set: { is_read: true, read_at: new Date() } }
    );

    return { modified_count: result.modifiedCount };
};
