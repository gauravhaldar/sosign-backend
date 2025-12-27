import express from "express";
import {
    getAds,
    getActiveAds,
    getAdById,
    createAd,
    updateAd,
    deleteAd,
    toggleAdStatus,
    trackAdClick,
    getAdsStats,
} from "../controllers/adsController.js";
import { adminAuth } from "../middleware/adminAuth.js";
import adsUpload from "../middleware/adsUpload.js";

const router = express.Router();

// Public routes
router.get("/active", getActiveAds);
router.post("/:id/click", trackAdClick);

// Admin routes
router.get("/stats", adminAuth, getAdsStats);
router.route("/")
    .get(adminAuth, getAds)
    .post(adminAuth, adsUpload.single("image"), createAd);

router.route("/:id")
    .get(adminAuth, getAdById)
    .put(adminAuth, adsUpload.single("image"), updateAd)
    .delete(adminAuth, deleteAd);

router.put("/:id/toggle", adminAuth, toggleAdStatus);

export default router;
