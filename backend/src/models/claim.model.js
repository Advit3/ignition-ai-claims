// =============================================================================
// claim.model.js — INSURANCE CLAIM DOCUMENT SCHEMA
// =============================================================================
// Uses strict snake_case to align 1:1 with the Python ML dataset.
// Added `fraud_score` and `status` fields required by the STP engine.
// =============================================================================

import mongoose from 'mongoose';
import { CLAIM_STATUS } from '../constants/appConstants.js';

// ─── SUB-SCHEMA: DOCUMENTS ARRAY ────────────────────────────────────────────
// Each entry represents a single uploaded file (URL from Cloudinary).
const documentSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true // e.g., "bill", "prescription", "fir"
    },
    file_url: {
        type: String,
        required: true // Cloudinary URL passed from the React frontend
    }
}, { _id: false }); // No auto _id — these are embedded sub-docs

// ─── SUB-SCHEMA: OCR DATA ───────────────────────────────────────────────────
// Populated by the Python ML microservice after document analysis.
const ocrDataSchema = new mongoose.Schema({
    bill_amount: { type: Number },
    date:        { type: Date },
    hospital:    { type: String }
}, { _id: false });

// ─── MAIN CLAIM SCHEMA ──────────────────────────────────────────────────────
const claimSchema = new mongoose.Schema({
    // Custom claim identifier (e.g., "CLM-a1b2c3")
    claim_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // References the User who submitted this claim (snake_case to match ML data)
    user_id: {
        type: String,
        required: true,
        index: true
    },

    // The dollar amount being claimed
    claim_amount: {
        type: Number,
        required: true
    },

    // Category of the claim
    claim_type: {
        type: String,
        required: true,
        lowercase: true, // "Health" → "health" automatically
        enum: ['health', 'car', 'ecommerce']
    },

    // Free-text description from the policyholder
    description: {
        type: String,
        trim: true
    },

    // Array of document objects (Cloudinary URLs)
    documents: {
        type: [documentSchema],
        default: []
    },

    // ─── ML / STP FIELDS (populated after Python API call) ───────────────

    /** Fraud probability returned by the ML model (0.0 – 1.0) */
    fraud_score: {
        type: Number,
        default: null, // null until the ML service responds
        min: 0,
        max: 1
    },

    /** Claim status assigned by the STP engine */
    status: {
        type: String,
        enum: Object.values(CLAIM_STATUS),
        default: CLAIM_STATUS.PENDING
    },

    /** OCR-extracted data from the Python microservice */
    ocr_data: {
        type: ocrDataSchema,
        default: {} // Always exists, even if OCR fails
    },

    /** Document-vs-claim match confidence (0 – 1) */
    doc_match: {
        type: Number,
        default: 0
    },

    /** Explicit creation timestamp (snake_case for ML dataset alignment) */
    created_at: {
        type: Date,
        default: Date.now
    }
    // Note: We do NOT use { timestamps: true } because `created_at` is explicit.
});

export const Claim = mongoose.model('Claim', claimSchema);