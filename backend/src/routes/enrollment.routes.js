import {Router} from "express";
import {protect,authorize} from "../middleware/auth.js";
import {myEnrollments,allEnrollments} from "../controllers/enrollment.controller.js";
const router=Router();
router.get("/me",protect,myEnrollments);
router.get("/",protect,authorize("admin"),allEnrollments);
export default router;
