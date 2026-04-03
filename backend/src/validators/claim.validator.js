// =============================================================================
// claim.validator.js — CLAIM INPUT VALIDATION CHAINS
// =============================================================================

import { body } from 'express-validator';

/**
 * Validation rules for POST /api/v1/claims/submit
 * Checks claim_type, claim_amount, document_url, and description.
 */
export const submitClaimValidator = [
    body('claim_type')
        .exists({ checkFalsy: true }).withMessage('claim_type is required')
        .isString().withMessage('claim_type must be a string')
        .trim()
        .notEmpty().withMessage('claim_type cannot be empty')
        .isLength({ max: 50 }).withMessage('claim_type must be at most 50 characters'),

    body('claim_amount')
        .exists({ checkNull: true }).withMessage('claim_amount is required')
        .isNumeric().withMessage('claim_amount must be a number')
        .isFloat({ min: 1, max: 10_000_000 })
        .withMessage('claim_amount must be between 1 and 10,000,000'),

    body('document_url')
        .exists({ checkFalsy: true }).withMessage('document_url is required')
        .isURL().withMessage('document_url must be a valid URL'),

    body('description')
        .optional()
        .isString().withMessage('description must be a string')
        .isLength({ max: 1000 }).withMessage('description must be at most 1000 characters'),
];
