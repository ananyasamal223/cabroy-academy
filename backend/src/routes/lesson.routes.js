import {Router} from "express";
import {protect,authorize} from "../middleware/auth.js";
import {updateLesson,deleteLesson} from "../controllers/lesson.controller.js";
import {completeLesson} from "../controllers/progress.controller.js";
const router=Router();
router.patch("/:id",protect,authorize("admin","instructor"),updateLesson);
router.delete("/:id",protect,authorize("admin","instructor"),deleteLesson);
router.post("/:courseId/:lessonId/complete",protect,completeLesson);
export default router;
