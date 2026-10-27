import {Router} from "express";
import {protect,authorize} from "../middleware/auth.js";
import {listAnnouncements,createAnnouncement,updateAnnouncement} from "../controllers/announcement.controller.js";
const router=Router();
router.get("/",protect,listAnnouncements);
router.post("/",protect,authorize("admin"),createAnnouncement);
router.patch("/:id",protect,authorize("admin"),updateAnnouncement);
export default router;
