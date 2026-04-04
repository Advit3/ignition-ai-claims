import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
    submitClaim,
    getUserClaims,
    getClaimById,
    updateClaimStatus,
} from "../services/claim.service.js";

/**
 * POST /api/v1/claims/submit
 */
export const submitClaimController = asyncHandler(async (req, res) => {
    console.log("[TRACE] 1. Received Request Body:", req.body);
    if (req.file) console.log(`[TRACE] 2. File identified: ${req.file.originalname}`);
    else console.log(`[TRACE] 2. File uploaded via Cloudinary: ${req.body.document_url}`);

    const { claim_type, claim_amount, document_url, description } = req.body;

    if (!claim_type || !claim_amount || !document_url) {
        throw new ApiError(400, "claim_type, claim_amount, and document_url are required");
    }

    const claim = await submitClaim({
        user_id: req.user.user_id, // Using custom user_id
        claim_type,
        claim_amount: Number(claim_amount),
        document_url,
        description: description || null,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, claim, "Claim submitted successfully"));
});

/**
 * GET /api/v1/claims
 */
export const getMyClaimsController = asyncHandler(async (req, res) => {
    // Pass the custom user_id string for the filter
    const result = await getUserClaims(req.user.user_id, req.query);

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Claims fetched successfully"));
});

/**
 * GET /api/v1/claims/:claimId
 */
export const getClaimByIdController = asyncHandler(async (req, res) => {
    const { claimId } = req.params; // Matches the route :claimId

    if (!claimId) {
        throw new ApiError(400, "Claim ID parameter is missing.");
    }

    const claim = await getClaimById(
        claimId,
        req.user.user_id,
        req.user.role === "admin"
    );

    return res
        .status(200)
        .json(new ApiResponse(200, claim, "Claim fetched successfully"));
});

/**
 * PATCH /api/v1/claims/:claimId/status
 */
export const updateClaimStatusController = asyncHandler(async (req, res) => {
    const { claimId } = req.params; // Matches the route :claimId
    const { status, reason } = req.body;

    if (!status) {
        throw new ApiError(400, "status is required");
    }

    const updatedClaim = await updateClaimStatus(
        claimId,
        { status, reason },
        req.user.user_id
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedClaim, "Claim status updated successfully"));
});