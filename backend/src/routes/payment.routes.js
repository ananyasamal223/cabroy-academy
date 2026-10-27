import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { createOrder, verifyPayment, myPayments, validatePromo } from "../controllers/payment.controller.js";

const router = Router();
router.post("/validate-promo", protect, validatePromo);
router.post("/create-order", protect, createOrder);
router.post("/verify", protect, verifyPayment);
router.get("/me", protect, myPayments);

export default router;
