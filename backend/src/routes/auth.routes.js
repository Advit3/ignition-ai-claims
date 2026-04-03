// =============================================================================
// auth.routes.js — AUTHENTICATION ROUTE DEFINITIONS
// =============================================================================

import { Router } from 'express';
import { googleLogin, getMe, refreshToken, logout } from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// ─── PUBLIC ROUTES ──────────────────────────────────────────────────────────

// POST /api/v1/auth/google — Exchange a Google ID token for session JWT
router.route("/google").post(googleLogin);

// POST /api/v1/auth/refresh — Get new access token using refresh token cookie
router.route("/refresh").post(refreshToken);

// ─── PROTECTED ROUTES ───────────────────────────────────────────────────────

// GET  /api/v1/auth/me — Fetch current user profile
router.route("/me").get(verifyJWT, getMe);

// POST /api/v1/auth/logout — Invalidate refresh token and clear cookie
router.route("/logout").post(verifyJWT, logout);

export default router;
