// =============================================================================
// auditLog.service.js — AUDIT LOG QUERY SERVICE
// =============================================================================
// Thin service layer around AuditLog model for admin queries.
// The actual record() logic lives on the model's static method.
// =============================================================================

import { AuditLog } from '../models/AuditLog.model.js';
import {
    DEFAULT_PAGE,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
} from '../constants/appConstants.js';

/**
 * getAuditLogs — paginated, filterable audit log fetch for admin dashboard.
 *
 * @param {Object} query — { page, limit, action, actor_id, target_type }
 * @returns {{ logs, total, page, limit, total_pages }}
 */
export const getAuditLogs = async (query = {}) => {
    const page  = Math.max(1, parseInt(query.page, 10)  || DEFAULT_PAGE);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE));
    const skip  = (page - 1) * limit;

    // Build dynamic filter
    const filter = {};
    if (query.action)      filter.action      = query.action;
    if (query.actor_id)    filter.actor_id     = query.actor_id;
    if (query.target_type) filter.target_type  = query.target_type;

    const [logs, total] = await Promise.all([
        AuditLog.find(filter)
            .populate('actor_id', 'full_name email user_id')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .select('-__v'),
        AuditLog.countDocuments(filter),
    ]);

    return {
        logs,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
    };
};
