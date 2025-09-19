import express from "express";
import {
  createComment,
  getCommentsByPetition,
  updateComment,
  deleteComment,
  toggleCommentLike,
  addReply,
  updateReply,
  deleteReply,
} from "../controllers/commentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Comment routes
router.route("/").post(protect, createComment);
router.route("/petition/:petitionId").get(getCommentsByPetition);
router
  .route("/:id")
  .put(protect, updateComment)
  .delete(protect, deleteComment);
router.route("/:id/like").put(protect, toggleCommentLike);

// Reply routes
router.route("/:id/reply").post(protect, addReply);
router
  .route("/:commentId/replies/:replyId")
  .put(protect, updateReply)
  .delete(protect, deleteReply);

export default router;
