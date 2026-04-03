// =============================================================================
// admin.validator.js — ADMIN INPUT VALIDATION CHAINS
// =============================================================================

import { body } from 'express-validator';
import { CLAIM_STATUS, USER_ROLES } from '../constants/appConstants.js';

/**
 * Validation rules for PUT /api/v1/admin/config/stp
 * Enforces threshold ranges AND cross-field auto_approve < auto_reject rule.
 */
export const updateStpConfigValidator = [
    body('auto_approve_threshold')
        .exists({ checkNull: true }).withMessage('auto_approve_threshold is required')
        .isFloat({ min: 0, max: 1 })
        .withMessage('auto_approve_threshold must be a float between 0 and 1'),

    body('auto_reject_threshold')
        .exists({ checkNull: true }).withMessage('auto_reject_threshold is required')
        .isFloat({ min: 0, max: 1 })
        .withMessage('auto_reject_threshold must be a float between 0 and 1'),

    // Cross-field validation: approve must be strictly less than reject
    body('auto_approve_threshold')
        .custom((value, { req }) => {
            const approve = parseFloat(value);
            const reject = parseFloat(req.body.auto_reject_threshold);
            if (!isNaN(approve) && !isNaN(reject) && approve >= reject) {
                throw new Error('auto_approve_threshold must be less than auto_reject_threshold');
            }
            return true;
        }),
];

/**
 * Validation rules for PATCH /api/v1/admin/claims/:id/status
 * Status must be a valid CLAIM_STATUS value.
 * Reason is required if status is rejected or escalated.
 */
export const updateClaimStatusValidator = [
    body('status')
        .exists({ checkFalsy: true }).withMessage('status is required')
        .isIn(Object.values(CLAIM_STATUS))
        .withMessage(`status must be one of: ${Object.values(CLAIM_STATUS).join(', ')}`),

    body('reason')
        .if(body('status').isIn([CLAIM_STATUS.REJECTED, CLAIM_STATUS.ESCALATED]))
        .exists({ checkFalsy: true }).withMessage('reason is required when status is rejected or escalated')
        .isString().withMessage('reason must be a string')
        .isLength({ max: 500 }).withMessage('reason must be at most 500 characters'),
];

/**
 * Validation rules for PATCH /api/v1/admin/users/:id/role
 * Role must be a valid USER_ROLES value.
 */
export const updateUserRoleValidator = [
    body('role')
        .exists({ checkFalsy: true }).withMessage('role is required')
        .isIn(Object.values(USER_ROLES))
        .withMessage(`role must be one of: ${Object.values(USER_ROLES).join(', ')}`),
];
