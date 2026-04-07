import mongoose from "mongoose";

const walletRequestSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        points: {
            type: Number,
            required: true,
            min: 0,
        },
        referenceId: {
            type: String,
            required: true,
            unique: true,
        },
        screenshot: {
            type: String,
            default: null,
        },
        status: {
            type: String,
            enum: ["pending", "verification_pending", "approved", "rejected"],
            default: "pending",
        },
        approvedBy: {
            type: String, // Storing Admin Email or ID
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const WalletRequest = mongoose.model("WalletRequest", walletRequestSchema);

export default WalletRequest;
