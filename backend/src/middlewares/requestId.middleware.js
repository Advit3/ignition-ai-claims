// =============================================================================
// requestId.middleware.js — REQUEST CORRELATION ID
// =============================================================================
// Attaches a unique UUID v4 to every incoming request. This ID:
//   - Is set as the X-Request-Id response header
//   - Is available as req.requestId for downstream usage
//   - Is passed to the ML service for distributed tracing
//   - Is stored in audit logs for correlation
// =============================================================================

import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware that attaches a unique request ID to every request.
 * If the client already sends an X-Request-Id header, we respect it.
 * Otherwise, we generate a new UUID v4.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const attachRequestId = (req, res, next) => {
    // Respect client-provided request ID (e.g., from API gateway)
    const requestId = req.headers['x-request-id'] || uuidv4();

    // Attach to request object for downstream access
    req.requestId = requestId;

    // Set as response header so the client can correlate logs
    res.setHeader('X-Request-Id', requestId);

    next();
};
