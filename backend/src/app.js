// =============================================================================
// app.js — EXPRESS APPLICATION SETUP
// =============================================================================
// Configures the middleware stack, route mounting, and error handling.
// Order matters: security → parsing → request ID → logging → rate limiting →
//                routes → 404 → global error handler
// =============================================================================

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { ApiError } from "./utils/ApiError.js";
import { ApiResponse } from "./utils/ApiResponse.js";
import logger, { morganMiddleware } from "./utils/logger.js";
import { attachRequestId } from "./middlewares/requestId.middleware.js";
import { generalLimiter, authLimiter } from "./middlewares/rateLimiter.middleware.js";
import { verifyJWT, isAdmin } from "./middlewares/auth.middleware.js";

const app = express();

// ==========================================
// 1. SECURITY & PARSING MIDDLEWARES
// ==========================================

// Helmet — sets security-related HTTP headers
app.use(helmet());

// CORS — allow React frontend to communicate
app.use(cors({
  origin:      process.env.CORS_ORIGIN || "*",
  credentials: true,
}));

// Parse JSON payloads (10kb limit to prevent DoS)
app.use(express.json({ limit: "10kb" }));

// Parse URL-encoded data
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Parse cookies (needed for refresh token flow)
app.use(cookieParser());

// Serve static files
app.use(express.static("public"));

// ==========================================
// 2. REQUEST TRACKING & LOGGING
// ==========================================

// Attach unique request ID to every request
app.use(attachRequestId);

// HTTP access logs piped through Winston
app.use(morganMiddleware);

// ==========================================
// 3. RATE LIMITING
// ==========================================

// General rate limiter on all routes
app.use(generalLimiter);

// ==========================================
// 4. ROUTE IMPORTS & MOUNTING
// ==========================================

// Health check (no auth, no rate limit on /health itself)
import healthRoutes from "./routes/health.routes.js";
app.use("/health", healthRoutes);

// Auth routes (stricter rate limiting)
import authRouter from "./routes/auth.routes.js";
app.use("/api/v1/auth", authLimiter, authRouter);

// Claim routes — any logged-in user (verifyJWT applied HERE, not in routes file)
import claimRoutes from "./routes/claim.routes.js";
app.use("/api/v1/claims", verifyJWT, claimRoutes);

// Notification routes (protected by JWT inside the router)
import notificationRoutes from "./routes/notification.routes.js";
app.use("/api/v1/notifications", notificationRoutes);

// Analytics routes — admins only (verifyJWT + isAdmin applied HERE)
import analyticsRoutes from "./routes/analytics.routes.js";
app.use("/api/v1/admin/analytics", verifyJWT, isAdmin, analyticsRoutes);

// ==========================================
// 5. 404 HANDLER
// ==========================================
app.use((req, _res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// ==========================================
// 6. GLOBAL ERROR HANDLER
// ==========================================
// Must be the LAST middleware. Catches all errors from asyncHandlers.
app.use((err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message    = err.message || "Internal Server Error";

  // Log with Winston
  logger.error(message, {
    stack:     err.stack,
    requestId: req.requestId,
    statusCode,
  });

  return res.status(statusCode).json(
    new ApiResponse(statusCode, null, message)
  );
});

export { app };