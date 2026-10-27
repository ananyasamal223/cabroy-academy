import {Router} from "express";
import {protect,authorize} from "../middleware/auth.js";
import rateLimit from "express-rate-limit";
import {getMySettings,updateMySettings,changeMyPassword,updateMyProfile,listUsers,getUser,updateUser} from "../controllers/user.controller.js";
import {listStudentNotifications,readStudentNotifications} from "../controllers/studentNotification.controller.js";
const router=Router();
router.get("/me/notifications",protect,listStudentNotifications);
router.patch("/me/notifications/read",protect,readStudentNotifications);
const passwordLimit=rateLimit({windowMs:15*60*1000,max:10,standardHeaders:true,legacyHeaders:false,message:{message:"Too many password-change attempts. Please try again later."}});
router.get("/me/settings",protect,getMySettings);
router.patch("/me/settings",protect,updateMySettings);
router.post("/me/password",protect,passwordLimit,changeMyPassword);
router.patch("/me",protect,updateMyProfile);
router.get("/",protect,authorize("admin"),listUsers);
router.get("/:id",protect,authorize("admin"),getUser);
router.patch("/:id",protect,authorize("admin"),updateUser);
export default router;

