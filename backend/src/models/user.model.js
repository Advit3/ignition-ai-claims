import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    // Matches the 'user_id' string format from your ML dataset (e.g., "U001")
    user_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Basic info pulled directly from Google Auth
    full_name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    profile_picture: {
        type: String, // Stores the Google profile picture URL for a polished UI
        default: ""
    },

    // Role-based access control for your React Dashboard
    role: {
        type: String,
        enum: ['policyholder', 'admin'],
        default: 'policyholder'
    },

    // 🔥 YOUR USP: The Dynamic Trust Engine
    // This scales from 0 to 100. New users start at 80.
    // If they submit fake claims, this drops. If they submit good claims, it rises.
    trust_score: {
        type: Number,
        default: 80,
        min: 0,
        max: 100
    }
}, {
    // Automatically adds 'createdAt' and 'updatedAt' timestamps
    timestamps: true
});

export const User = mongoose.model('User', userSchema);