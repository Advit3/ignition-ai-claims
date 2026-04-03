// =============================================================================
// logger.js — STRUCTURED LOGGING WITH WINSTON + MORGAN
// =============================================================================
// Provides a centralized logger for the entire application.
// - Production: JSON format, warn+ only
// - Development: colorized, human-readable, all levels
// Also exports a Morgan middleware that pipes HTTP access logs through Winston.
// =============================================================================

import winston from 'winston';
import morgan from 'morgan';

// ─── Determine environment ──────────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';

// ─── Custom log format for development ──────────────────────────────────────
const devFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
        const meta = Object.keys(metadata).length
            ? ` ${JSON.stringify(metadata)}`
            : '';
        return `[${timestamp}] ${level}: ${message}${meta}`;
    })
);

// ─── Custom log format for production ───────────────────────────────────────
const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// ─── Create the Winston logger instance ─────────────────────────────────────
/**
 * @type {winston.Logger}
 * Centralized logger with methods: info, warn, error, debug, http
 * Usage: logger.info("message", { key: "value" })
 */
const logger = winston.createLogger({
    level: isProduction ? 'warn' : 'debug',
    format: isProduction ? prodFormat : devFormat,
    defaultMeta: { service: 'insurance-stp-api' },
    transports: [
        new winston.transports.Console(),
    ],
});

// ─── Morgan → Winston bridge ────────────────────────────────────────────────
/**
 * Express middleware that pipes HTTP access logs through Winston at the 'http'
 * level. Skips logging in test environments to keep test output clean.
 *
 * Logs: method, url, status, response-time, content-length
 */
const morganMiddleware = morgan(
    ':method :url :status :res[content-length] - :response-time ms',
    {
        stream: {
            /** @param {string} message — formatted log line from Morgan */
            write: (message) => logger.http(message.trim()),
        },
        skip: () => process.env.NODE_ENV === 'test',
    }
);

export { logger, morganMiddleware };
export default logger;
