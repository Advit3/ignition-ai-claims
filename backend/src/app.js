// =============================================================================
// app.js — EXPRESS APPLICATION SETUP
// =============================================================================
// This is the Express application instance. It configures:
//   1. Global middlewares (CORS, JSON parsing, static files)
//   2. API route mounting (versioned under /api/v1/*)
//   3. Global error handler (must be LAST)
// =============================================================================

import express from 'express';
import cors from 'cors';
import { ApiError } from './utils/ApiError.js';

const app = express();

// ==========================================
// 1. GLOBAL MIDDLEWARES
// ==========================================

// Enable CORS so the React frontend can communicate with this API
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*', // In production, lock to your React app's URL
    credentials: true
}));

// Parse incoming JSON payloads (with a limit to prevent payload-too-large attacks)
app.use(express.json({ limit: "16kb" }));

// Parse URL-encoded data (data sent via standard HTML forms)
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Serve static files from the 'public' directory
app.use(express.static("public"));


// ==========================================
// 2. ROUTE IMPORTS & MOUNTING
// ==========================================

// ── Auth routes (Sprint 2) ──────────────────────────────────────────────────
import authRouter from './routes/auth.routes.js';
app.use("/api/v1/auth", authRouter);

// ── Claim routes (Sprint 3) ─────────────────────────────────────────────────
import claimRouter from './routes/claim.routes.js';
app.use("/api/v1/claims", claimRouter);

// ── Admin routes (Sprint 4) ─────────────────────────────────────────────────
import adminRouter from './routes/admin.routes.js';
app.use("/api/v1/admin", adminRouter);

import healthcheckRouter from "./routes/healthcheck.routes.js";
app.use("/api/v1/healthcheck", healthcheckRouter);

// ==========================================
// 3. HEALTH CHECK
// ==========================================
// Simple endpoint to verify the server is alive (used by load balancers / monitoring)
app.get("/api/v1/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});


// ==========================================
// 4. GLOBAL ERROR HANDLER
// ==========================================
// This MUST be the last middleware. It catches any errors thrown by asyncHandlers.
app.use((err, req, res, next) => {
    let error = err;

    // If the error isn't already our custom ApiError, convert it
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || 500;
        const message = error.message || "Internal Server Error";
        error = new ApiError(statusCode, message, error?.errors || [], err.stack);
    }

    // Format the final JSON response sent to the frontend
    const response = {
        success: error.success,
        statusCode: error.statusCode,
        message: error.message,
        errors: error.errors,
        // Only expose the stack trace in development mode
        ...(process.env.NODE_ENV === "development" && { stack: error.stack })
    };

    return res.status(error.statusCode).json(response);
});



// ... existing middlewares (cors, json, etc.)


// ... rest of the file
export { app };