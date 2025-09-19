import express from "express";
import {
  createPetition,
  getPetitions,
  getPetitionById,
  updatePetition,
  deletePetition,
  getUserPetitions,
  signPetition,
  checkUserSignature,
  getPetitionsByCountry,
  getPopularPetitions,
  getPetitionStats,
} from "../controllers/petitionController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Base routes - temporarily remove protect middleware for testing
router
  .route("/")
  .post(protect, upload.single("image"), createPetition)
  .get(getPetitions);

// Special routes (must come before /:id to avoid conflicts)
router.route("/my-petitions").get(protect, getUserPetitions);
router.route("/popular").get(getPopularPetitions);
router.route("/stats").get(getPetitionStats);
router.route("/country/:country").get(getPetitionsByCountry);

// ID-specific routes
router
  .route("/:id")
  .get(getPetitionById)
  .put(protect, updatePetition)
  .delete(protect, deletePetition);

router.route("/:id/sign").put(protect, signPetition);
router.route("/:id/check-signature").get(protect, checkUserSignature);

export default router;
