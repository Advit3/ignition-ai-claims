import mongoose from 'mongoose';

const stpConfigSchema = new mongoose.Schema({
    config_name: {
        type: String,
        default: "global_stp_rules",
        unique: true,
        index: true
    },
    // Claims with a fraud score below this are instantly approved
    auto_approve_threshold: {
        type: Number,
        default: 0.20,
        min: [0.0, "Threshold cannot be below 0"],
        max: [1.0, "Threshold cannot exceed 1.0"]
    },
    // Claims with a fraud score above this are instantly rejected
    auto_reject_threshold: {
        type: Number,
        default: 0.85,
        min: [0.0, "Threshold cannot be below 0"],
        max: [1.0, "Threshold cannot exceed 1.0"],
        // 🔥 Enterprise Validation: Ensures Reject is always higher than Approve
        validate: {
            validator: function (value) {
                return value > this.auto_approve_threshold;
            },
            message: "Auto-reject threshold must be strictly greater than the auto-approve threshold."
        }
    },
    // Hard cap on money. Claims requesting more than this ALWAYS go to manual review.
    max_stp_amount: {
        type: Number,
        default: 50000,
        min: [0, "Max STP amount cannot be negative"]
    },
    // Tracks who tweaked the sliders (Admin's User ID)
    last_updated_by: {
        type: String,
        default: "system_init"
    }
}, { timestamps: true });

export const StpConfig = mongoose.model('StpConfig', stpConfigSchema);