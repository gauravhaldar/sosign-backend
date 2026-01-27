import asyncHandler from "express-async-handler";
import Wallet from "../models/walletModel.js";

// @desc    Get user wallet
// @route   GET /api/wallet
// @access  Private
const getWallet = asyncHandler(async (req, res) => {
    const wallet = await Wallet.getOrCreateWallet(req.user._id);

    res.status(200).json({
        balance: wallet.balance,
        transactions: wallet.transactions.sort((a, b) => b.createdAt - a.createdAt),
    });
});

// @desc    Add money to wallet
// @route   POST /api/wallet/add
// @access  Private
const addMoney = asyncHandler(async (req, res) => {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
        res.status(400);
        throw new Error("Please provide a valid amount greater than 0");
    }

    const wallet = await Wallet.getOrCreateWallet(req.user._id);

    // Add transaction
    wallet.transactions.push({
        type: "credit",
        amount: parseFloat(amount),
        description: description || "Added money to wallet",
    });

    // Update balance
    wallet.balance += parseFloat(amount);

    await wallet.save();

    res.status(200).json({
        message: "Money added successfully",
        balance: wallet.balance,
        transaction: wallet.transactions[wallet.transactions.length - 1],
    });
});

// @desc    Deduct money from wallet
// @route   POST /api/wallet/deduct
// @access  Private
const deductMoney = asyncHandler(async (req, res) => {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
        res.status(400);
        throw new Error("Please provide a valid amount greater than 0");
    }

    const wallet = await Wallet.getOrCreateWallet(req.user._id);

    if (wallet.balance < amount) {
        res.status(400);
        throw new Error("Insufficient wallet balance");
    }

    // Add transaction
    wallet.transactions.push({
        type: "debit",
        amount: parseFloat(amount),
        description: description || "Deducted from wallet",
    });

    // Update balance
    wallet.balance -= parseFloat(amount);

    await wallet.save();

    res.status(200).json({
        message: "Money deducted successfully",
        balance: wallet.balance,
        transaction: wallet.transactions[wallet.transactions.length - 1],
    });
});

// @desc    Get wallet balance only
// @route   GET /api/wallet/balance
// @access  Private
const getBalance = asyncHandler(async (req, res) => {
    const wallet = await Wallet.getOrCreateWallet(req.user._id);

    res.status(200).json({
        balance: wallet.balance,
    });
});

export { getWallet, addMoney, deductMoney, getBalance };
