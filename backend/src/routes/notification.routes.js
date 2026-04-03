// =============================================================================
// notification.routes.js — USER NOTIFICATION ROUTE DEFINITIONS
// =============================================================================
// Protected by verifyJWT — users can only manage their own notifications.
// =============================================================================

import { Router } from 'express';
import {
    getNotifications,
    markOneAsRead,
    markAllRead,
} from '../controllers/notification.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// GET   /api/v1/notifications — Paginated notifications (filter by is_read)
router.route("/").get(getNotifications);

// PATCH /api/v1/notifications/read-all — Mark all as read (must be BEFORE :id)
router.route("/read-all").patch(markAllRead);

// PATCH /api/v1/notifications/:id/read — Mark a single notification as read
router.route("/:id/read").patch(markOneAsRead);

export default router;
