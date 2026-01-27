import express from "express";
import {
    getWallet,
    addMoney,
    deductMoney,
    getBalance,
} from "../controllers/walletController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.get("/", protect, getWallet);
router.get("/balance", protect, getBalance);
router.post("/add", protect, addMoney);
router.post("/deduct", protect, deductMoney);

export default router;
