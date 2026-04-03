// =============================================================================
// notification.controller.js — USER NOTIFICATION CONTROLLER
// =============================================================================
// Thin controller for user-facing notification endpoints.
// Protected by verifyJWT — users can only see their own notifications.
// =============================================================================

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { HTTP } from '../constants/appConstants.js';
import * as notificationService from '../services/notification.service.js';

// ─── GET /api/v1/notifications ──────────────────────────────────────────────
/**
 * Fetch Paginated Notifications for the Authenticated User
 *
 * Query params: page, limit, is_read (filter)
 */
export const getNotifications = asyncHandler(async (req, res) => {
    const result = await notificationService.getUserNotifications(req.user._id, req.query);

    return res.status(HTTP.OK).json(
        new ApiResponse(HTTP.OK, result, "Notifications fetched successfully.")
    );
});

// ─── PATCH /api/v1/notifications/:id/read ───────────────────────────────────
/**
 * Mark a Single Notification as Read
 */
export const markOneAsRead = asyncHandler(async (req, res) => {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);

    return res.status(HTTP.OK).json(
        new ApiResponse(HTTP.OK, notification, "Notification marked as read.")
    );
});

// ─── PATCH /api/v1/notifications/read-all ───────────────────────────────────
/**
 * Mark All Notifications as Read for the Current User
 */
export const markAllRead = asyncHandler(async (req, res) => {
    const result = await notificationService.markAllAsRead(req.user._id);

    return res.status(HTTP.OK).json(
        new ApiResponse(HTTP.OK, result, "All notifications marked as read.")
    );
});
