// =============================================================================
// claim.model.js — INSURANCE CLAIM DOCUMENT SCHEMA
// =============================================================================
// Uses strict snake_case to align 1:1 with the Python ML dataset.
// Includes fraud_score, status, lifecycle fields, and ML tracing fields.
// =============================================================================

import mongoose from 'mongoose';
import { CLAIM_STATUS } from '../constants/appConstants.js';

// ─── SUB-SCHEMA: DOCUMENTS ARRAY ────────────────────────────────────────────
const documentSchema = new mongoose.Schema({
    /** Document category (e.g., "bill", "prescription", "fir") */
    type: {
        type: String,
        required: true,
    },
    /** Cloudinary URL passed from the React frontend */
    file_url: {
        type: String,
        required: true,
    },
}, { _id: false });

// ─── SUB-SCHEMA: OCR DATA ───────────────────────────────────────────────────
const ocrDataSchema = new mongoose.Schema({
    /** Extracted bill amount from the document */
    bill_amount: { type: Number },
    /** Extracted date from the document */
    date: { type: Date },
    /** Extracted hospital/provider name */
    provider_name: { type: String },
}, { _id: false });

// ─── MAIN CLAIM SCHEMA ──────────────────────────────────────────────────────
const claimSchema = new mongoose.Schema({
    /** Custom claim identifier (e.g., "CLM-a1b2c3") */
    claim_id: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },

    /** Custom user_id of the policyholder who submitted this claim */
    user_id: {
        type: String,
        required: true,
        index: true,
    },

    /** The dollar amount being claimed */
    claim_amount: {
        type: Number,
        required: true,
    },

    /** Category of the claim */
    claim_type: {
        type: String,
        required: true,
        lowercase: true,
        enum: ['health', 'auto', 'gadget'],
    },

    /** Free-text description from the policyholder */
    description: {
        type: String,
        trim: true,
    },

    /** Array of uploaded document objects (Cloudinary URLs) */
    documents: {
        type: [documentSchema],
        default: [],
    },

    // ─── ML / STP FIELDS ────────────────────────────────────────────────

    /** Fraud probability returned by the ML model (0.0 – 1.0) */
    fraud_score: {
        type: Number,
        default: null,
        min: 0,
        max: 1,
    },

    /** Claim status assigned by the STP engine or admin */
    claim_status: {
        type: String,
        enum: Object.values(CLAIM_STATUS),
        default: CLAIM_STATUS.PENDING,
        index: true,
    },

    /** Human-readable reason for rejection/escalation */
    status_reason: {
        type: String,
    },

    /** OCR-extracted data from the Python microservice */
    ocr_data: {
        type: ocrDataSchema,
        default: {},
    },

    /** Document-vs-claim match confidence (0 – 1) */
    doc_match: {
        type: Number,
        default: 0,
    },

    /** Detected Type via OCR */
    detected_type: {
        type: String,
    },

    /** Mismatched or flagging reasons from Engine */
    reasons: {
        type: [String],
        default: [],
    },

    /** Risk Level */
    risk_level: {
        type: String,
        enum: ['low', 'medium', 'high', 'Low', 'Medium', 'High'],
    },

    payment_status: {
        type: String,
        enum: ['pending', 'initiated', 'processing', 'completed'],
    },

    // ─── LIFECYCLE / ASSIGNMENT FIELDS ──────────────────────────────────

    /** Adjuster assigned to review this claim */
    assigned_to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    /** Admin/adjuster who last updated this claim */
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    // ─── ML TRACING ─────────────────────────────────────────────────────

    /** The X-Request-Id sent to the ML service for distributed tracing */
    ml_request_id: {
        type: String,
    },

    /** Full raw ML response payload — hidden by default (admin-only) */
    ml_raw_response: {
        type: mongoose.Schema.Types.Mixed,
        select: false,
    },

    // ─── TIMESTAMPS ─────────────────────────────────────────────────────

    /** Explicit creation timestamp (snake_case for ML dataset alignment) */
    created_at: {
        type: Date,
        default: Date.now,
    },

    /** Last update timestamp */
    updated_at: {
        type: Date,
    },
});

claimSchema.pre('save', async function () { // Added 'async', no 'next'
    if (!this.isNew) {
        this.updated_at = new Date();
    }
    // No next() needed here!
});

export const Claim = mongoose.model('Claim', claimSchema);