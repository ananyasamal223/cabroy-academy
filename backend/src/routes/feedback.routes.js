import { Router } from "express";
import { protect, authorizeAdminPermission } from "../middleware/auth.js";
import {
  deleteFeedback,
  exportAdminFeedback,
  getAdminFeedback,
  getMyCourseFeedback,
  getPublicFeedback,
  updateFeedbackStatus,
  upsertCourseFeedback,
} from "../controllers/feedback.controller.js";

const router = Router();

// Public homepage testimonials: published feedback only
router.get("/public", getPublicFeedback);

// Student feedback endpoints
router.get("/course/:courseId/me", protect, getMyCourseFeedback);
router.put("/course/:courseId", protect, upsertCourseFeedback);

// Admin feedback dashboard endpoints
router.get("/admin", protect, authorizeAdminPermission("reports"), getAdminFeedback);
router.get("/admin/export", protect, authorizeAdminPermission("reports"), exportAdminFeedback);
router.patch(
  "/admin/:feedbackId/status",
  protect,
  authorizeAdminPermission("reports"),
  updateFeedbackStatus
);
router.delete(
  "/admin/:feedbackId",
  protect,
  authorizeAdminPermission("reports"),
  deleteFeedback
);

export default router;
