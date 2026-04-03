// src/controllers/analytics.controller.js

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse }  from "../utils/ApiResponse.js";
import { ApiError }     from "../utils/ApiError.js";
import { getAnalytics } from "../services/analytics.service.js";
import { StpConfig }    from "../models/stpConfig.model.js";

/**
 * GET /api/v1/admin/analytics
 * Returns the full analytics payload for the admin analytics page.
 * Protected by verifyJWT + isAdmin.
 */
export const getAnalyticsController = asyncHandler(async (req, res) => {
  const data = await getAnalytics();

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Analytics fetched successfully"));
});

/**
 * GET /api/v1/admin/analytics/stp-config
 * Returns the current STP configuration.
 */
export const getStpConfigController = asyncHandler(async (req, res) => {
  const config = await StpConfig.findOne().lean();

  if (!config) {
    throw new ApiError(404, "STP configuration not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, config, "STP config fetched successfully"));
});

/**
 * PUT /api/v1/admin/analytics/stp-config
 * Updates the STP configuration thresholds.
 * Validates that auto_approve < auto_reject before saving.
 */
export const updateStpConfigController = asyncHandler(async (req, res) => {
  const { auto_approve_threshold, auto_reject_threshold } = req.body;

  // Validate both values are present
  if (auto_approve_threshold === undefined || auto_reject_threshold === undefined) {
    throw new ApiError(400, "auto_approve_threshold and auto_reject_threshold are required");
  }

  const approve = parseFloat(auto_approve_threshold);
  const reject  = parseFloat(auto_reject_threshold);

  // Validate range
  if (approve < 0 || approve > 1 || reject < 0 || reject > 1) {
    throw new ApiError(400, "Thresholds must be between 0 and 1");
  }

  // Core business rule
  if (approve >= reject) {
    throw new ApiError(
      400,
      "auto_approve_threshold must be strictly less than auto_reject_threshold"
    );
  }

  const updatedConfig = await StpConfig.findOneAndUpdate(
    {},
    { auto_approve_threshold: approve, auto_reject_threshold: reject },
    { new: true, upsert: true, lean: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedConfig, "STP config updated successfully"));
});
