// backend/src/routes/notification.routes.js

import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = Router();

/**
 * GET /api/v1/notifications
 * Returns empty list for now — placeholder until notification system is built.
 * Protected by verifyJWT.
 */
router.get(
  "/",
  verifyJWT,
  asyncHandler(async (req, res) => {
    return res
      .status(200)
      .json(new ApiResponse(200, { notifications: [], total: 0 }, "Notifications fetched"));
  })
);

/**
 * PATCH /api/v1/notifications/:id/read
 * Placeholder — marks a notification as read.
 */
router.patch(
  "/:id/read",
  verifyJWT,
  asyncHandler(async (req, res) => {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Notification marked as read"));
  })
);

export default router;
