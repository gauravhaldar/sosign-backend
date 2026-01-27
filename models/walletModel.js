import mongoose from "mongoose";

const transactionSchema = mongoose.Schema({
    type: {
        type: String,
        enum: ["credit", "debit"],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    description: {
        type: String,
        default: "",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const walletSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        balance: {
            type: Number,
            default: 0,
            min: 0,
        },
        transactions: [transactionSchema],
    },
    {
        timestamps: true,
    }
);

// Create or get wallet for a user
walletSchema.statics.getOrCreateWallet = async function (userId) {
    let wallet = await this.findOne({ userId });
    if (!wallet) {
        wallet = await this.create({ userId, balance: 0, transactions: [] });
    }
    return wallet;
};

const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet;
