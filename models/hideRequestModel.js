import mongoose from "mongoose";

const hideRequestSchema = mongoose.Schema(
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
            default: "",
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        adminNote: {
            type: String,
            default: "",
        },
        reviewedBy: {
            type: String,
            default: "",
        },
        reviewedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const HideRequest = mongoose.model("HideRequest", hideRequestSchema);

export default HideRequest;
