// =============================================================================
// admin.service.js — ADMIN DASHBOARD BUSINESS LOGIC
// =============================================================================
// "Fat Service" for all admin operations:
//   1. Paginated claim listing with optional filters
//   2. Dashboard KPI statistics (aggregation pipeline)
//   3. STP configuration CRUD with validation
// =============================================================================

import { Claim } from '../models/claim.model.js';
import { StpConfig } from '../models/stpConfig.model.js';
import { ApiError } from '../utils/ApiError.js';
import {
    HTTP,
    CLAIM_STATUS,
    STP_CONFIG_NAME,
    DEFAULT_STP,
    PAGINATION,
} from '../constants/appConstants.js';

// =============================================================================
// 1. CLAIM MANAGEMENT
// =============================================================================

/**
 * getPaginatedClaims — fetches a paginated, filterable list of all claims.
 *
 * Supports:
 *   - Pagination via `page` and `limit` query params
 *   - Filtering by `status` (approved, rejected, pending)
 *   - Filtering by `claim_type` (health, car, ecommerce)
 *   - Sorting by `created_at` (newest first by default)
 *
 * @param {Object} queryParams — { page, limit, status, claim_type, sort_by, order }
 * @returns {{ claims, pagination }}
 */
export const getPaginatedClaims = async (queryParams) => {
    const {
        page      = PAGINATION.DEFAULT_PAGE,
        limit     = PAGINATION.DEFAULT_LIMIT,
        status,
        claim_type,
        sort_by   = 'created_at',
        order     = 'desc',
    } = queryParams;

    // ── Sanitize pagination values ──────────────────────────────────────
    const pageNum  = Math.max(1, parseInt(page, 10) || PAGINATION.DEFAULT_PAGE);
    const limitNum = Math.min(
        PAGINATION.MAX_LIMIT,
        Math.max(1, parseInt(limit, 10) || PAGINATION.DEFAULT_LIMIT)
    );
    const skip = (pageNum - 1) * limitNum;

    // ── Build dynamic filter ────────────────────────────────────────────
    const filter = {};
    if (status && Object.values(CLAIM_STATUS).includes(status)) {
        filter.status = status;
    }
    if (claim_type) {
        filter.claim_type = claim_type.toLowerCase();
    }

    // ── Build sort object ───────────────────────────────────────────────
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = { [sort_by]: sortOrder };

    // ── Execute query + count in parallel for efficiency ────────────────
    const [claims, totalDocuments] = await Promise.all([
        Claim.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum)
            .select("-__v"),
        Claim.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalDocuments / limitNum);

    return {
        claims,
        pagination: {
            current_page:    pageNum,
            total_pages:     totalPages,
            total_documents: totalDocuments,
            per_page:        limitNum,
            has_next_page:   pageNum < totalPages,
            has_prev_page:   pageNum > 1,
        },
    };
};

// =============================================================================
// 2. DASHBOARD KPI STATISTICS
// =============================================================================

/**
 * getClaimStats — returns key performance indicators for the admin dashboard.
 *
 * Uses a MongoDB aggregation pipeline for efficient server-side computation:
 *   - Total claims count
 *   - Count per status (approved, rejected, pending)
 *   - Average fraud score across all claims
 *   - Total claim amount
 *
 * @returns {Object} KPI statistics
 */
export const getClaimStats = async () => {
    // ── Aggregation pipeline ────────────────────────────────────────────
    const pipeline = [
        {
            // Group ALL documents into a single result
            $group: {
                _id: null,
                total_claims:       { $sum: 1 },
                total_claim_amount: { $sum: "$claim_amount" },
                average_fraud_score: { $avg: "$fraud_score" },

                // Conditional counts per status
                approved_count: {
                    $sum: { $cond: [{ $eq: ["$status", CLAIM_STATUS.APPROVED] }, 1, 0] }
                },
                rejected_count: {
                    $sum: { $cond: [{ $eq: ["$status", CLAIM_STATUS.REJECTED] }, 1, 0] }
                },
                pending_count: {
                    $sum: { $cond: [{ $eq: ["$status", CLAIM_STATUS.PENDING] }, 1, 0] }
                },
            },
        },
        {
            // Clean up the output shape
            $project: {
                _id: 0,
                total_claims:        1,
                total_claim_amount:  1,
                average_fraud_score: { $round: ["$average_fraud_score", 4] },
                approved_count:      1,
                rejected_count:      1,
                pending_count:       1,
            },
        },
    ];

    const results = await Claim.aggregate(pipeline);

    // If there are no claims at all, return zeroed-out stats
    if (!results.length) {
        return {
            total_claims:        0,
            total_claim_amount:  0,
            average_fraud_score: 0,
            approved_count:      0,
            rejected_count:      0,
            pending_count:       0,
        };
    }

    return results[0];
};

// =============================================================================
// 3. STP CONFIGURATION MANAGEMENT
// =============================================================================

/**
 * getStpConfig — retrieves the current STP rules from MongoDB.
 * If no config document exists yet, returns hardcoded defaults from appConstants.
 *
 * @returns {Object} STP configuration
 */
export const getStpConfig = async () => {
    let config = await StpConfig.findOne({ config_name: STP_CONFIG_NAME }).select("-__v");

    // First-time access: no config in DB yet → return constants
    if (!config) {
        return {
            config_name:            STP_CONFIG_NAME,
            auto_approve_threshold: DEFAULT_STP.AUTO_APPROVE_THRESHOLD,
            auto_reject_threshold:  DEFAULT_STP.AUTO_REJECT_THRESHOLD,
            max_stp_amount:         DEFAULT_STP.MAX_STP_AMOUNT,
            last_updated_by:        "system_init",
        };
    }

    return config;
};

/**
 * updateStpConfig — updates the STP rules with validation.
 *
 * Business rules enforced:
 *   1. auto_approve_threshold MUST be less than auto_reject_threshold
 *   2. All thresholds must be between 0.0 and 1.0
 *   3. max_stp_amount must be a positive number
 *
 * Uses `findOneAndUpdate` with `upsert: true` so it creates the document
 * on first update if it doesn't exist yet.
 *
 * @param {Object} updateData — the new threshold values
 * @param {Object} adminUser  — the admin making the change (for audit trail)
 * @returns {Object} updated STP configuration
 */
export const updateStpConfig = async (updateData, adminUser) => {
    const { auto_approve_threshold, auto_reject_threshold, max_stp_amount } = updateData;

    // ── Validation: approve must be strictly less than reject ────────────
    if (
        auto_approve_threshold !== undefined &&
        auto_reject_threshold !== undefined &&
        auto_approve_threshold >= auto_reject_threshold
    ) {
        throw new ApiError(
            HTTP.BAD_REQUEST,
            "auto_approve_threshold must be strictly less than auto_reject_threshold."
        );
    }

    // ── Validation: thresholds must be in [0.0, 1.0] ────────────────────
    if (auto_approve_threshold !== undefined) {
        if (auto_approve_threshold < 0 || auto_approve_threshold > 1) {
            throw new ApiError(
                HTTP.BAD_REQUEST,
                "auto_approve_threshold must be between 0.0 and 1.0."
            );
        }
    }

    if (auto_reject_threshold !== undefined) {
        if (auto_reject_threshold < 0 || auto_reject_threshold > 1) {
            throw new ApiError(
                HTTP.BAD_REQUEST,
                "auto_reject_threshold must be between 0.0 and 1.0."
            );
        }
    }

    // ── Validation: max_stp_amount must be positive ─────────────────────
    if (max_stp_amount !== undefined && max_stp_amount <= 0) {
        throw new ApiError(
            HTTP.BAD_REQUEST,
            "max_stp_amount must be a positive number."
        );
    }

    // ── Cross-validate with existing DB values when only one is provided ─
    if (
        (auto_approve_threshold !== undefined && auto_reject_threshold === undefined) ||
        (auto_approve_threshold === undefined && auto_reject_threshold !== undefined)
    ) {
        const existingConfig = await StpConfig.findOne({ config_name: STP_CONFIG_NAME });
        const currentApprove = auto_approve_threshold ?? existingConfig?.auto_approve_threshold ?? DEFAULT_STP.AUTO_APPROVE_THRESHOLD;
        const currentReject  = auto_reject_threshold  ?? existingConfig?.auto_reject_threshold  ?? DEFAULT_STP.AUTO_REJECT_THRESHOLD;

        if (currentApprove >= currentReject) {
            throw new ApiError(
                HTTP.BAD_REQUEST,
                "auto_approve_threshold must be strictly less than auto_reject_threshold (including existing values)."
            );
        }
    }

    // ── Build the update payload ────────────────────────────────────────
    const updatePayload = { last_updated_by: adminUser.user_id };
    if (auto_approve_threshold !== undefined) updatePayload.auto_approve_threshold = auto_approve_threshold;
    if (auto_reject_threshold !== undefined)  updatePayload.auto_reject_threshold  = auto_reject_threshold;
    if (max_stp_amount !== undefined)         updatePayload.max_stp_amount         = max_stp_amount;

    // ── Upsert: update if exists, create if not ─────────────────────────
    const updatedConfig = await StpConfig.findOneAndUpdate(
        { config_name: STP_CONFIG_NAME },
        { $set: updatePayload },
        {
            new:           true,   // Return the updated document
            upsert:        true,   // Create if it doesn't exist
            runValidators: true,   // Run Mongoose schema validators
        }
    ).select("-__v");

    return updatedConfig;
};
