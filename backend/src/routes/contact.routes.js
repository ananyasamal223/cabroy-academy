import {Router} from "express";
import {protect,authorize} from "../middleware/auth.js";
import {createContact,listContacts,updateContact} from "../controllers/contact.controller.js";
const router=Router();
router.post("/",createContact);
router.get("/",protect,authorize("admin"),listContacts);
router.patch("/:id",protect,authorize("admin"),updateContact);
export default router;
