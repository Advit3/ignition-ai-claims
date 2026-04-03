// =============================================================================
// admin.routes.js — ADMIN DASHBOARD ROUTE DEFINITIONS
// =============================================================================
// Every route is dual-protected:
//   1. verifyJWT  — ensures the user is authenticated
//   2. isAdmin    — ensures the user has the 'admin' role
// =============================================================================

import { Router } from 'express';
import {
    getAllClaims,
    getClaimStats,
    getStpConfig,
    updateStpConfig,
} from '../controllers/admin.controller.js';
import { verifyJWT, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// ── Apply both auth middlewares to ALL admin routes ──────────────────────────
router.use(verifyJWT, isAdmin);

// ─── CLAIMS MANAGEMENT ──────────────────────────────────────────────────────

// GET /api/v1/admin/claims — Paginated list of all claims
router.route("/claims").get(getAllClaims);

// GET /api/v1/admin/claims/stats — Dashboard KPI statistics
router.route("/claims/stats").get(getClaimStats);

// ─── STP CONFIGURATION ──────────────────────────────────────────────────────

// GET  /api/v1/admin/config/stp — Fetch current STP rules
// PUT  /api/v1/admin/config/stp — Update STP rules
router.route("/config/stp")
    .get(getStpConfig)
    .put(updateStpConfig);

export default router;
