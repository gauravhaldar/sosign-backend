import express from "express";
import {
  createSuccessfulPetition,
  getSuccessfulPetitions,
  getSuccessfulPetitionById,
  updateSuccessfulPetition,
  deleteSuccessfulPetition,
  getSuccessfulPetitionsByCategory,
  getSuccessfulPetitionsStats,
} from "../controllers/successfulPetitionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Base routes
router
  .route("/")
  .post(protect, createSuccessfulPetition)  // Create new successful petition
  .get(getSuccessfulPetitions);             // Get all successful petitions

// Special routes (must come before /:id to avoid conflicts)
router.route("/stats").get(getSuccessfulPetitionsStats);
router.route("/category/:category").get(getSuccessfulPetitionsByCategory);

// ID-specific routes
router
  .route("/:id")
  .get(getSuccessfulPetitionById)      // Get specific successful petition
  .put(protect, updateSuccessfulPetition)   // Update successful petition
  .delete(protect, deleteSuccessfulPetition); // Delete successful petition

export default router;
