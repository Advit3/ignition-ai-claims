import { Router } from "express";
import {
    submitClaimController,
    getMyClaimsController,
    getClaimByIdController,
    updateClaimStatusController,
} from "../controllers/claim.controller.js";

const router = Router();

/**
 * All routes here are already protected by verifyJWT
 * applied at the app.js level. Do NOT add verifyJWT again here.
 */

// 1. Submit a new claim
router.post("/submit", submitClaimController);

// 2. Get all claims belonging to the logged-in user
router.get("/", getMyClaimsController);

// 3. Get a single claim by custom ID (Notice the change to :claimId)
router.get("/:claimId", getClaimByIdController);

// 4. Update claim status (Notice the change to :claimId)
router.patch("/:claimId/status", updateClaimStatusController);

export default router;