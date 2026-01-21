import express from "express";
import {
    getCategories,
    createCategory,
    getCategoryBySlug,
} from "../controllers/categoryController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getCategories);
router.get("/:slug", getCategoryBySlug);

// Protected routes (requires authentication)
router.post("/", protect, createCategory);

export default router;
