// =============================================================================
// claim.controller.js — THIN CLAIM CONTROLLER
// =============================================================================
// HTTP layer only: validate input, call claim.service, return ApiResponse.
// No business logic, no DB queries, no external API calls.
// =============================================================================

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP } from '../constants/appConstants.js';
import * as claimService from '../services/claim.service.js';

// ─── POST /api/v1/claims/submit ─────────────────────────────────────────────
/**
 * Submit a New Insurance Claim
 *
 * Expects in req.body:
 *   - claim_amount  (number, required)
 *   - claim_type    (string, required — "health" | "car" | "ecommerce")
 *   - description   (string, optional)
 *   - documents     (array of { type, file_url }, optional)
 *
 * The Python ML microservice is called automatically; the STP engine assigns
 * a status. The controller never knows about these details — it's all in the service.
 */
export const submitClaim = asyncHandler(async (req, res) => {
    const { claim_amount, claim_type, description, documents } = req.body;

    // ── Input validation (controller's job) ─────────────────────────────
    if (!claim_amount || !claim_type) {
        throw new ApiError(
            HTTP.BAD_REQUEST,
            "Both 'claim_amount' and 'claim_type' are required."
        );
    }

    if (typeof claim_amount !== 'number' || claim_amount <= 0) {
        throw new ApiError(
            HTTP.BAD_REQUEST,
            "'claim_amount' must be a positive number."
        );
    }

    // ── Delegate everything to the service ──────────────────────────────
    const newClaim = await claimService.submitClaim(
        { claim_amount, claim_type, description, documents },
        req.user // Attached by verifyJWT middleware
    );

    // ── Respond with the created claim ──────────────────────────────────
    return res.status(HTTP.CREATED).json(
        new ApiResponse(HTTP.CREATED, newClaim, "Claim submitted and processed successfully.")
    );
});

// ─── GET /api/v1/claims/my-claims ───────────────────────────────────────────
/**
 * Get All Claims for the Authenticated User
 *
 * Returns claims sorted by newest first.
 */
export const getMyClaims = asyncHandler(async (req, res) => {
    const claims = await claimService.getUserClaims(req.user.user_id);

    return res.status(HTTP.OK).json(
        new ApiResponse(HTTP.OK, {
            total: claims.length,
            claims,
        }, "Claims fetched successfully.")
    );
});

// ─── GET /api/v1/claims/:claimId ────────────────────────────────────────────
/**
 * Get a Single Claim by its Custom claim_id
 *
 * Enforces ownership: users can only fetch their own claims.
 */
export const getClaimById = asyncHandler(async (req, res) => {
    const { claimId } = req.params;

    if (!claimId) {
        throw new ApiError(HTTP.BAD_REQUEST, "Claim ID is required.");
    }

    const claim = await claimService.getClaimById(claimId, req.user);

    return res.status(HTTP.OK).json(
        new ApiResponse(HTTP.OK, claim, "Claim details fetched successfully.")
    );
});
