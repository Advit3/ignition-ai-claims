// src/routes/analytics.routes.js

import { Router } from "express";
import {
  getAnalyticsController,
  getStpConfigController,
  updateStpConfigController,
} from "../controllers/analytics.controller.js";

const router = Router();

/**
 * All routes here are already protected by verifyJWT + isAdmin
 * applied at the app.js level.
 */

// Full analytics payload — one call for the entire page
router.get("/", getAnalyticsController);

// STP config — view and update
router.get("/stp-config", getStpConfigController);

router.patch("/stp-config", updateStpConfigController)
export default router;
