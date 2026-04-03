// =============================================================================
// validate.middleware.js — GENERIC VALIDATION MIDDLEWARE FACTORY
// =============================================================================
// Wraps express-validator chains into a reusable middleware. If any validation
// rule fails, throws ApiError(400) with the first error message.
// =============================================================================

import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';
import { HTTP } from '../constants/appConstants.js';

/**
 * Factory function that creates middleware from an array of express-validator
 * validation chains.
 *
 * Usage in routes:
 *   router.post("/submit", validate(submitClaimValidator), submitClaim);
 *
 * @param {import('express-validator').ValidationChain[]} validations
 * @returns {import('express').RequestHandler} Express middleware
 */
export const validate = (validations) => {
    return async (req, res, next) => {
        // Run all validation chains in parallel
        await Promise.all(validations.map((validation) => validation.run(req)));

        // Collect results
        const errors = validationResult(req);

        if (errors.isEmpty()) {
            return next();
        }

        // Extract the first error message for a clean API response
        const extractedErrors = errors.array().map((err) => ({
            field:   err.path,
            message: err.msg,
        }));

        throw new ApiError(
            HTTP.BAD_REQUEST,
            extractedErrors[0].message,
            extractedErrors
        );
    };
};
