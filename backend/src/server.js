// =============================================================================
// server.js — APPLICATION ENTRY POINT
// =============================================================================
// 1. Validates required environment variables (fail-fast)
// 2. Connects to MongoDB
// 3. Starts the Express server
// 4. Handles graceful shutdown (SIGTERM, SIGINT, unhandled rejections)
// =============================================================================

import dotenv from 'dotenv';
dotenv.config({ path: "./.env" });

import mongoose from 'mongoose';
import connectDB from './db/index.js';
import { app } from './app.js';
import logger from './utils/logger.js';

// ==========================================
// 1. ENVIRONMENT VARIABLE VALIDATION
// ==========================================
const REQUIRED_ENV_VARS = [
    "PORT",
    "MONGODB_URI",
    "CORS_ORIGIN",
];

// Optional but recommended — log warnings for missing non-critical vars
const RECOMMENDED_ENV_VARS = [
    "ACCESS_TOKEN_SECRET",
    "REFRESH_TOKEN_SECRET",
    "GOOGLE_CLIENT_ID",
    "ML_SERVICE_URL",
    "EMAIL_HOST",
    "EMAIL_USER",
    "EMAIL_PASS",
];

const missingRequired = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingRequired.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missingRequired.join(", ")}`);
    process.exit(1);
}

const missingRecommended = RECOMMENDED_ENV_VARS.filter((key) => !process.env[key]);
if (missingRecommended.length > 0) {
    logger.warn(`Missing recommended env vars (features may be limited): ${missingRecommended.join(", ")}`);
}

// Backward compat: JWT_SECRET → ACCESS_TOKEN_SECRET fallback
if (!process.env.ACCESS_TOKEN_SECRET && process.env.JWT_SECRET) {
    process.env.ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
    logger.info('Using JWT_SECRET as ACCESS_TOKEN_SECRET (backward compat)');
}

// ==========================================
// 2. DATABASE CONNECTION + SERVER START
// ==========================================
let server;

connectDB()
    .then(() => {
        const port = process.env.PORT || 8000;

        server = app.listen(port, () => {
            logger.info(`🚀 Server is running on port: ${port}`);
            logger.info(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
        });

        server.on('error', (error) => {
            logger.error('Express server error', { error: error.message });
            throw error;
        });
    })
    .catch((error) => {
        logger.error(`❌ MongoDB connection failed: ${error.message}`);
        process.exit(1);
    });

// ==========================================
// 3. GRACEFUL SHUTDOWN
// ==========================================
/**
 * Graceful shutdown handler — closes HTTP server, then MongoDB connection,
 * then exits the process cleanly.
 *
 * @param {string} signal — the signal that triggered shutdown
 */
const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);

    if (server) {
        server.close(async () => {
            try {
                await mongoose.connection.close();
                logger.info('MongoDB connection closed. Process exiting.');
            } catch (err) {
                logger.error('Error closing MongoDB connection', { error: err.message });
            }
            process.exit(0);
        });
    } else {
        process.exit(0);
    }

    // Force kill after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
        logger.error('Graceful shutdown timed out. Forcing exit.');
        process.exit(1);
    }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', { reason: reason?.message || reason });
    shutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    shutdown('uncaughtException');
});