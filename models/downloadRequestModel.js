import mongoose from "mongoose";

const downloadRequestSchema = mongoose.Schema(
    {
        petition: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Petition",
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reason: {
            type: String,
            required: true,
            maxlength: 500,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        adminNote: {
            type: String,
            maxlength: 500,
        },
        approvedBy: {
            type: String, // Admin username
        },
        approvedAt: {
            type: Date,
        },
        downloadedAt: {
            type: Date, // Track when the user actually downloaded the file
        },
        downloadCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to prevent duplicate pending requests
downloadRequestSchema.index({ petition: 1, user: 1, status: 1 });

const DownloadRequest = mongoose.model("DownloadRequest", downloadRequestSchema);

export default DownloadRequest;
