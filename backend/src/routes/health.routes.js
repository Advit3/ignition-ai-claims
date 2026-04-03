// =============================================================================
// health.routes.js — HEALTH CHECK ROUTE DEFINITIONS
// =============================================================================
// NOT protected — used by Docker/K8s liveness and readiness probes.
// =============================================================================

import { Router } from 'express';
import { liveness, readiness } from '../controllers/health.controller.js';

const router = Router();

// GET /health — Liveness probe (always 200 if process is running)
router.route("/").get(liveness);

// GET /health/ready — Readiness probe (checks DB + ML connectivity)
router.route("/ready").get(readiness);

export default router;
