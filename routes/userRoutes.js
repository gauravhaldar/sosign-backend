import express from "express";
import {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  authGoogleUser,
  getUserByCode,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", authUser);
router.post("/logout", logoutUser);
router.route("/profile").get(protect, getUserProfile);
router.post("/google-auth", authGoogleUser);
router.get("/code/:code", getUserByCode);

export default router;
