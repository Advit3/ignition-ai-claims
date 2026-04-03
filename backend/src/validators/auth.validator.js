// =============================================================================
// auth.validator.js — AUTHENTICATION INPUT VALIDATION CHAINS
// =============================================================================

import { body } from 'express-validator';

/**
 * Validation rules for POST /api/v1/auth/google
 * Ensures the Google ID token is present and non-empty.
 */
export const googleAuthValidator = [
    body('google_token')
        .exists({ checkFalsy: true }).withMessage('google_token is required')
        .isString().withMessage('google_token must be a string')
        .notEmpty().withMessage('google_token cannot be empty'),
];
