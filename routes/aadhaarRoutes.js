import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  sendAadhaarOtp,
  verifyAadhaarOtp,
} from "../controllers/aadhaarController.js";

const router = express.Router();

router.post("/send-otp", protect, sendAadhaarOtp);
router.post("/verify-otp", protect, verifyAadhaarOtp);

export default router;
