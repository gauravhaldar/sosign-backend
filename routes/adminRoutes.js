import express from "express";
import {
  adminLogin,
  adminLogout,
  getCurrentAdmin,
  getUsers,
  getUnapprovedPetitions,
  approvePetition,
  getAdminStats,
} from "../controllers/adminController.js";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  getPetitions,
  getAllPetitionsForAdmin,
  getPetitionById,
  deletePetition,
} from "../controllers/petitionController.js";
import {
  getSuccessfulPetitions,
  getSuccessfulPetitionById,
  deleteSuccessfulPetition,
} from "../controllers/successfulPetitionController.js";
import {
  getCommentsByPetition,
  deleteComment,
} from "../controllers/commentController.js";

const router = express.Router();

// Public route
router.post("/login", adminLogin);

// Protected route
router.get("/me", adminAuth, getCurrentAdmin);

// Get admin dashboard stats
router.get("/stats", adminAuth, getAdminStats);

// ✅ Logout route should NOT use adminAuth middleware
router.post("/logout", adminLogout);

//get user info
router.get("/customers", getUsers);

// Get unapproved petitions
router.get("/petitions/unapproved", adminAuth, getUnapprovedPetitions);
// Approve petition
router.put("/petitions/:id/approve", adminAuth, approvePetition);

// Admin petition management routes
router.get("/petitions", adminAuth, getAllPetitionsForAdmin);
router.get("/petitions/:id", adminAuth, getPetitionById);
router.delete("/petitions/:id", adminAuth, deletePetition);

// Admin successful petition management routes
router.get("/successful-petitions", adminAuth, getSuccessfulPetitions);
router.get("/successful-petitions/:id", adminAuth, getSuccessfulPetitionById);
router.delete("/successful-petitions/:id", adminAuth, deleteSuccessfulPetition);

// Admin comment management routes
router.get("/petitions/:petitionId/comments", adminAuth, getCommentsByPetition);
router.delete("/comments/:id", adminAuth, deleteComment);

export default router;
