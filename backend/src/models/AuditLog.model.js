// =============================================================================
// AuditLog.model.js — IMMUTABLE AUDIT TRAIL
// =============================================================================
// Records every significant action in the system for compliance and debugging.
// Audit logs are WRITE-ONLY — they are never updated or deleted.
// The static `record()` method catches errors silently so audit logging
// never crashes the main request flow.
// =============================================================================

import mongoose from 'mongoose';
import { AUDIT_ACTIONS } from '../constants/appConstants.js';
import logger from '../utils/logger.js';

const auditLogSchema = new mongoose.Schema({
    /**
     * The type of action performed.
     * Must be one of the AUDIT_ACTIONS enum values.
     */
    action: {
        type: String,
        required: true,
        enum: Object.values(AUDIT_ACTIONS),
        index: true,
    },

    /** ObjectId of the user who performed the action */
    actor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },

    /** Snapshot of the actor's role at the time of the action */
    actor_role: {
        type: String,
    },

    /** The type of document that was acted upon */
    target_type: {
        type: String,
        enum: ['Claim', 'StpConfig', 'User'],
    },

    /** ObjectId of the target document (dynamic ref via target_type) */
    target_id: {
        type: mongoose.Schema.Types.ObjectId,
    },

    /** JSON snapshot of the document BEFORE the change (null for create actions) */
    before_state: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },

    /** JSON snapshot of the document AFTER the change */
    after_state: {
        type: mongoose.Schema.Types.Mixed,
    },

    /** IP address of the client that triggered the action */
    ip_address: {
        type: String,
    },

    /** UUID v4 request ID — correlates with Winston logs and ML service calls */
    request_id: {
        type: String,
    },

    /** Immutable creation timestamp — no updated_at for audit logs */
    created_at: {
        type: Date,
        default: Date.now,
    },
});

// ─── Compound index for efficient filtered queries ──────────────────────────
auditLogSchema.index({ action: 1, created_at: -1 });
auditLogSchema.index({ actor_id: 1, created_at: -1 });

// ─── STATIC METHOD: record() ────────────────────────────────────────────────
/**
 * Creates an audit log entry. Catches and logs errors silently — audit
 * logging must NEVER crash the main request.
 *
 * @param {Object} params
 * @param {string} params.action     — one of AUDIT_ACTIONS values
 * @param {Object} params.actor      — the user performing the action (req.user)
 * @param {Object} params.target     — { type: "Claim"|"StpConfig"|"User", id: ObjectId }
 * @param {Object} params.before     — snapshot before change (null for creates)
 * @param {Object} params.after      — snapshot after change
 * @param {Object} params.req        — Express request object (for IP and requestId)
 */
auditLogSchema.statics.record = async function ({ action, actor, target, before, after, req }) {
    try {
        await this.create({
            action,
            actor_id:    actor?._id,
            actor_role:  actor?.role,
            target_type: target?.type,
            target_id:   target?.id,
            before_state: before || null,
            after_state:  after || null,
            ip_address:  req?.ip || req?.connection?.remoteAddress || 'unknown',
            request_id:  req?.requestId || 'unknown',
        });
    } catch (err) {
        // Silently log — NEVER throw from audit logging
        logger.error('Failed to write audit log', {
            action,
            error: err.message,
            requestId: req?.requestId,
        });
    }
};

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
