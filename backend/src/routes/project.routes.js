import {Router} from "express";
import {protect,authorize} from "../middleware/auth.js";
import {myProjects,listProjects,reviewProject} from "../controllers/project.controller.js";
const router=Router();
router.get("/me",protect,myProjects);
router.get("/",protect,authorize("admin","instructor"),listProjects);
router.patch("/:id/review",protect,authorize("admin","instructor"),reviewProject);
export default router;
