// =============================================================================
// admin.controller.js — THIN ADMIN CONTROLLER
// =============================================================================
// HTTP layer for admin dashboard endpoints.
// All routes here are protected by BOTH verifyJWT AND isAdmin middlewares.
// =============================================================================

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP } from '../constants/appConstants.js';
import * as adminService from '../services/admin.service.js';

// ─── GET /api/v1/admin/claims ───────────────────────────────────────────────
/**
 * Fetch Paginated Claims List
 *
 * Query params:
 *   - page       (number, default 1)
 *   - limit      (number, default 10, max 100)
 *   - status     ("approved" | "rejected" | "pending")
 *   - claim_type ("health" | "car" | "ecommerce")
 *   - sort_by    (field name, default "created_at")
 *   - order      ("asc" | "desc", default "desc")
 */
export const getAllClaims = asyncHandler(async (req, res) => {
    const result = await adminService.getPaginatedClaims(req.query);

    return res.status(HTTP.OK).json(
        new ApiResponse(HTTP.OK, result, "Claims fetched successfully.")
    );
});

// ─── GET /api/v1/admin/claims/stats ─────────────────────────────────────────
/**
 * Fetch Dashboard KPI Statistics
 *
 * Returns:
 *   - total_claims, total_claim_amount
 *   - approved_count, rejected_count, pending_count
 *   - average_fraud_score
 */
export const getClaimStats = asyncHandler(async (req, res) => {
    const stats = await adminService.getClaimStats();

    return res.status(HTTP.OK).json(
        new ApiResponse(HTTP.OK, stats, "Claim statistics fetched successfully.")
    );
});

// ─── GET /api/v1/admin/config/stp ───────────────────────────────────────────
/**
 * Fetch Current STP Configuration Rules
 */
export const getStpConfig = asyncHandler(async (req, res) => {
    const config = await adminService.getStpConfig();

    return res.status(HTTP.OK).json(
        new ApiResponse(HTTP.OK, config, "STP configuration fetched successfully.")
    );
});

// ─── PUT /api/v1/admin/config/stp ───────────────────────────────────────────
/**
 * Update STP Configuration Rules
 *
 * Expects in req.body (all optional, but at least one required):
 *   - auto_approve_threshold (number, 0.0 – 1.0)
 *   - auto_reject_threshold  (number, 0.0 – 1.0)
 *   - max_stp_amount         (number, > 0)
 *
 * Validation: auto_approve_threshold MUST be less than auto_reject_threshold.
 */
export const updateStpConfig = asyncHandler(async (req, res) => {
    const { auto_approve_threshold, auto_reject_threshold, max_stp_amount } = req.body;

    // ── Input validation: at least one field must be provided ───────────
    if (
        auto_approve_threshold === undefined &&
        auto_reject_threshold === undefined &&
        max_stp_amount === undefined
    ) {
        throw new ApiError(
            HTTP.BAD_REQUEST,
            "At least one configuration field must be provided (auto_approve_threshold, auto_reject_threshold, or max_stp_amount)."
        );
    }

    // ── Delegate to service for business validation + persistence ────────
    const updatedConfig = await adminService.updateStpConfig(
        { auto_approve_threshold, auto_reject_threshold, max_stp_amount },
        req.user // The admin making the change (attached by verifyJWT)
    );

    return res.status(HTTP.OK).json(
        new ApiResponse(HTTP.OK, updatedConfig, "STP configuration updated successfully.")
    );
});
