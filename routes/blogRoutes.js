import express from "express";
import {
    getBlogs,
    getAllBlogsAdmin,
    getBlogBySlug,
    getBlogById,
    createBlog,
    updateBlog,
    deleteBlog,
    toggleFeatured,
    togglePublished,
} from "../controllers/blogController.js";
import { adminAuth } from "../middleware/adminAuth.js";
import blogUpload from "../middleware/blogUpload.js";

const router = express.Router();

// Public routes
router.get("/", getBlogs);

// Admin routes (must be before :slug route)
router.get("/admin/all", adminAuth, getAllBlogsAdmin);
router.get("/admin/:id", adminAuth, getBlogById);
router.post("/", adminAuth, blogUpload.single("image"), createBlog);
router.put("/:id", adminAuth, blogUpload.single("image"), updateBlog);
router.delete("/:id", adminAuth, deleteBlog);
router.patch("/:id/featured", adminAuth, toggleFeatured);
router.patch("/:id/publish", adminAuth, togglePublished);

// Public route for single blog (must be last)
router.get("/:slug", getBlogBySlug);

export default router;
