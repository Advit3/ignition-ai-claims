// =============================================================================
// auth.routes.js — AUTHENTICATION ROUTE DEFINITIONS
// =============================================================================

import { Router } from 'express';
import { googleLogin, getMe } from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// ─── PUBLIC ROUTES ──────────────────────────────────────────────────────────

// POST /api/v1/auth/google — Exchange a Google ID token for a session JWT
router.route("/google").post(googleLogin);

// ─── PROTECTED ROUTES ───────────────────────────────────────────────────────

// GET /api/v1/auth/me — Fetch the currently authenticated user's profile
router.route("/me").get(verifyJWT, getMe);

export default router;
