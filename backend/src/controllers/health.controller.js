// =============================================================================
// health.controller.js — HEALTH CHECK CONTROLLER
// =============================================================================
// Unprotected endpoints for Docker/K8s liveness and readiness probes.
// =============================================================================

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { HTTP, HEALTH_STATUS } from '../constants/appConstants.js';
import * as healthService from '../services/health.service.js';

// ─── GET /health ────────────────────────────────────────────────────────────
/**
 * Liveness Probe — always returns 200 if the process is running.
 * Used by container orchestrators to know the process is alive.
 */
export const liveness = asyncHandler(async (_req, res) => {
    return res.status(HTTP.OK).json(
        new ApiResponse(HTTP.OK, { status: HEALTH_STATUS.HEALTHY }, "Service is alive.")
    );
});

// ─── GET /health/ready ──────────────────────────────────────────────────────
/**
 * Readiness Probe — checks DB and ML service connectivity.
 * Returns 200 if healthy/degraded, 503 if unhealthy.
 */
export const readiness = asyncHandler(async (_req, res) => {
    const health = await healthService.getHealthStatus();

    const statusCode = health.status === HEALTH_STATUS.UNHEALTHY
        ? HTTP.SERVICE_UNAVAILABLE
        : HTTP.OK;

    return res.status(statusCode).json(
        new ApiResponse(statusCode, health, `Service is ${health.status}.`)
    );
});
