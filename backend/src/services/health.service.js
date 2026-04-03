// =============================================================================
// health.service.js — HEALTH CHECK BUSINESS LOGIC
// =============================================================================
// Checks connectivity to all dependent services (MongoDB, ML API) and
// returns an aggregate health status for Kubernetes probes.
// =============================================================================

import mongoose from 'mongoose';
import axios from 'axios';
import { HEALTH_STATUS } from '../constants/appConstants.js';
import { ML_ENDPOINTS } from '../constants/mlServiceContract.js';
import logger from '../utils/logger.js';

/**
 * getHealthStatus — readiness probe logic.
 *
 * Checks:
 *   1. MongoDB connection state
 *   2. ML microservice /health endpoint (with 3s timeout)
 *
 * Returns aggregate status:
 *   - HEALTHY   = all systems go
 *   - DEGRADED  = non-critical service down (ML)
 *   - UNHEALTHY = critical service down (DB)
 *
 * @returns {Object} health report
 */
export const getHealthStatus = async () => {
    // ── Database check ──────────────────────────────────────────────────
    const dbState    = mongoose.connection.readyState;
    const dbStatus   = dbState === 1 ? HEALTH_STATUS.HEALTHY : HEALTH_STATUS.UNHEALTHY;

    // ── ML service check ────────────────────────────────────────────────
    let mlStatus = HEALTH_STATUS.HEALTHY;
    const mlBaseUrl = process.env.ML_SERVICE_URL || process.env.PYTHON_ML_API_URL;

    if (mlBaseUrl) {
        try {
            await axios.get(`${mlBaseUrl}${ML_ENDPOINTS.HEALTH}`, { timeout: 3000 });
        } catch {
            mlStatus = HEALTH_STATUS.DEGRADED;
        }
    } else {
        mlStatus = HEALTH_STATUS.DEGRADED; // Not configured
    }

    // ── Aggregate ───────────────────────────────────────────────────────
    let overall;
    if (dbStatus === HEALTH_STATUS.UNHEALTHY) {
        overall = HEALTH_STATUS.UNHEALTHY;
    } else if (mlStatus !== HEALTH_STATUS.HEALTHY) {
        overall = HEALTH_STATUS.DEGRADED;
    } else {
        overall = HEALTH_STATUS.HEALTHY;
    }

    return {
        status:          overall,
        timestamp:       new Date().toISOString(),
        uptime_seconds:  Math.floor(process.uptime()),
        memory_mb:       Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        services: {
            database:    dbStatus,
            ml_service:  mlStatus,
        },
    };
};
