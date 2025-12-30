import mongoose from "mongoose";

// Available data fields that can be requested/approved
const AVAILABLE_FIELDS = [
    "petitionDetails",      // Title, problem, solution, country, categories
    "petitionStarter",      // Name, location, comment
    "decisionMakers",       // List of decision makers
    "statistics",           // Signature count, comment count
    "signatures",           // Full list of signatures with user info
    "comments",             // Full list of comments with user info
];

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
        // Fields requested by the user
        requestedFields: {
            type: [String],
            enum: AVAILABLE_FIELDS,
            default: AVAILABLE_FIELDS, // Default to all fields
        },
        // Fields approved by the admin (subset of requestedFields)
        approvedFields: {
            type: [String],
            enum: AVAILABLE_FIELDS,
            default: [],
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

export { AVAILABLE_FIELDS };
export default DownloadRequest;
