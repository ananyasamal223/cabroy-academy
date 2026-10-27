import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  bookSession,
  myMentorSessions,
  cancelSession,
  allMentorSessions,
  updateSessionStatus,
  getAvailability,
} from "../controllers/mentorSession.controller.js";

const router = Router();

router.get("/availability", protect, getAvailability);
router.post("/", protect, bookSession);
router.get("/me", protect, myMentorSessions);
router.delete("/:id", protect, cancelSession);

router.get("/", protect, authorize("admin", "instructor"), allMentorSessions);
router.patch("/:id", protect, authorize("admin", "instructor"), updateSessionStatus);

export default router;
