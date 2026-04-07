import express from "express";
import {
    createWalletRequest,
    uploadProof,
    getAllWalletRequests,
    approveWalletRequest,
    rejectWalletRequest,
    getMyWalletRequests,
} from "../controllers/walletRequestController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminAuth } from "../middleware/adminAuth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// User routes
router.post("/create", protect, createWalletRequest);
router.post("/upload-proof/:requestId", protect, upload.single("screenshot"), uploadProof);
router.get("/my-requests", protect, getMyWalletRequests);

// Admin routes
router.get("/admin/all", adminAuth, getAllWalletRequests);
router.put("/admin/approve/:requestId", adminAuth, approveWalletRequest);
router.put("/admin/reject/:requestId", adminAuth, rejectWalletRequest);

export default router;
