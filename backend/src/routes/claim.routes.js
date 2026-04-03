// =============================================================================
// claim.routes.js — CLAIM ROUTE DEFINITIONS
// =============================================================================
// All claim routes are protected by verifyJWT — only authenticated users
// can submit or view claims.
// =============================================================================

import { Router } from 'express';
import {
    submitClaim,
    getMyClaims,
    getClaimById,
} from '../controllers/claim.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// ── All routes below require authentication ─────────────────────────────────
router.use(verifyJWT);

// POST /api/v1/claims/submit — Submit a new insurance claim
router.route("/submit").post(submitClaim);

// GET /api/v1/claims/my-claims — List all claims for the logged-in user
router.route("/my-claims").get(getMyClaims);

// GET /api/v1/claims/:claimId — Get a specific claim by its custom claim_id
router.route("/:claimId").get(getClaimById);

export default router;
