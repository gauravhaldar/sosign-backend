import express from "express";
import { generateCaptcha } from "../utils/captchaUtils.js";

const router = express.Router();

// @desc    Generate a new CAPTCHA challenge
// @route   GET /api/captcha/generate
// @access  Public
router.get("/generate", (req, res) => {
    try {
        const captcha = generateCaptcha();
        res.json({
            success: true,
            question: captcha.question,
            token: captcha.token,
        });
    } catch (error) {
        console.error("Error generating CAPTCHA:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate CAPTCHA",
        });
    }
});

export default router;
