import {Router} from "express";
import {protect} from "../middleware/auth.js";
import {myCertificates,verifyCertificate} from "../controllers/certificate.controller.js";
const router=Router();
router.get("/me",protect,myCertificates);
router.get("/verify/:certificateId",verifyCertificate);
export default router;
