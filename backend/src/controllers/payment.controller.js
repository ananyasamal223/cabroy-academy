import crypto from "crypto";
import { subscriptionExpiry } from "../utils/subscriptions.js";
import { resolvePlanPurchase } from "../config/plans.js";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import Course from "../models/Course.js";
import Payment from "../models/Payment.js";
import SalesPerson from "../models/SalesPerson.js";
import { enrollUserInCourse } from "../utils/enrollUser.js";

function getRazorpayClient() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    const err = new Error("Razorpay keys are not configured on the server");
    err.status = 500;
    throw err;
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

function normalizePromoCode(value) {
  return String(value || "").trim().toUpperCase();
}

function calculatePromoDiscount(subtotal, promoConfig) {
  if (!promoConfig) return 0;
  const percentDiscount = (Number(subtotal) * Number(promoConfig.discountPercent || 0)) / 100;
  const maxDiscount = Number(promoConfig.maxDiscount || 0);
  const capped = maxDiscount > 0 ? Math.min(percentDiscount, maxDiscount) : percentDiscount;
  return Math.round(Math.max(0, Math.min(Number(subtotal), capped)) * 100) / 100;
}

async function getActivePromo(promoCode) {
  const normalized = normalizePromoCode(promoCode);
  if (!normalized) return null;

  const salesPerson = await SalesPerson.findOne({
    isActive: true,
    removedAt: null,
    $or: [
      { promoCode: normalized },
      { "promoCodes.code": normalized },
    ],
  });
  if (!salesPerson) return null;

  const row = (salesPerson.promoCodes || []).find(
    (promo) => promo.code === normalized && promo.isActive !== false
  );

  if (row) {
    return {
      salesPerson,
      promo: {
        code: row.code,
        discountPercent: row.discountPercent,
        maxDiscount: row.maxDiscount,
        isActive: row.isActive !== false,
      },
    };
  }

  // Backwards compatibility for existing sales people created before multi-code support.
  if (salesPerson.promoCode === normalized) {
    return {
      salesPerson,
      promo: {
        code: salesPerson.promoCode,
        discountPercent: salesPerson.discountPercent,
        maxDiscount: salesPerson.maxDiscount,
        isActive: true,
      },
    };
  }

  return null;
}

// POST /api/payments/validate-promo  { promoCode }
// Validation is server-side so random text can no longer be accepted as a promo code.
export async function validatePromo(req, res) {
  const promoCode = normalizePromoCode(req.body.promoCode);
  if (!promoCode) return res.status(400).json({ message: "Enter a promo code" });

  const match = await getActivePromo(promoCode);
  if (!match) {
    return res.status(404).json({ message: "Invalid or inactive promo code" });
  }

  res.json({
    valid: true,
    promoCode: match.promo.code,
    salesPerson: { id: match.salesPerson._id, name: match.salesPerson.name },
    discountPercent: match.promo.discountPercent,
    maxDiscount: match.promo.maxDiscount,
  });
}

// POST /api/payments/create-order
// Accepts EITHER { courseId } for a single course OR { courseIds: [...] } for a cart.
// courseId/courseIds may be a real MongoDB _id OR a slug — the frontend uses slugs
// in its URLs, so we match on whichever was sent.
export async function createOrder(req, res) {
  if (typeof req.body.accountEmail !== "string" || req.body.accountEmail.trim().toLowerCase() !== req.user.email?.toLowerCase()) {
    return res.status(409).json({ message: "The checkout email must match your signed-in account. Sign in with the account that should receive this purchase before paying." });
  }
  const { courseId, courseIds, promoCode, planId, billing } = req.body;
  let courses = [];
  let subtotal;
  let plan = null;
  if (planId !== undefined) {
    plan = resolvePlanPurchase(planId, billing);
    if (!plan) return res.status(400).json({ message: "Choose a valid plan and billing period" });
    if (courseId || courseIds) return res.status(400).json({ message: "Check out plans and courses separately" });
    subtotal = plan.amount;
  } else {
    const requestedIds = Array.isArray(courseIds) && courseIds.length ? courseIds : [courseId];
    if (requestedIds.some((id) => typeof id !== "string" || !id.trim())) {
      return res.status(400).json({ message: "Valid course IDs are required" });
    }
    const ids = [...new Set(requestedIds.map((id) => id.trim()))];
    const idFilters = ids.map((id) => mongoose.isValidObjectId(id) ? { _id: id } : { slug: id });
    courses = await Course.find({ $or: idFilters, isPublished: true });
    if (courses.length !== ids.length) return res.status(404).json({ message: "One or more courses are not available" });
    subtotal = Math.round(courses.reduce((sum, course) => sum + Number(course.price || 0), 0) * 100) / 100;
  }

  let salesPerson = null;
  let promoConfig = null;
  const normalizedPromo = normalizePromoCode(promoCode);
  if (normalizedPromo) {
    const match = await getActivePromo(normalizedPromo);
    if (!match) {
      return res.status(400).json({ message: "Invalid or inactive promo code" });
    }
    salesPerson = match.salesPerson;
    promoConfig = match.promo;
  }

  const discount = calculatePromoDiscount(subtotal, promoConfig);
  const amountInRupees = Math.round(Math.max(0, subtotal - discount) * 100) / 100;
  const amount = Math.round(amountInRupees * 100); // paise

  if (!Number.isSafeInteger(amount) || amount < 100) {
    return res.status(400).json({ message: "Online payment requires a total of at least INR 1. Contact the academy for enrollment." });
  }

  const razorpay = getRazorpayClient();
  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: `order_${crypto.randomBytes(16).toString("hex")}`,
    notes: {
      courseCount: String(courses.length),
      planId: plan?.id || "",
      billing: plan?.billing || "",
      userId: String(req.user._id),
      promoCode: promoConfig?.code || "",
      salesPersonId: salesPerson ? String(salesPerson._id) : "",
    },
  });

  await Payment.create({
    user: req.user._id,
    courses: courses.map((c) => c._id),
    planId: plan?.id || null,
    planName: plan?.name || "",
    billing: plan?.billing || null,
    subtotal,
    discount,
    amount: amountInRupees,
    promoCode: promoConfig?.code || "",
    salesPerson: salesPerson?._id || null,
    currency: "INR",
    razorpayOrderId: order.id,
    status: "created",
  });

  res.status(201).json({
    order,
    keyId: process.env.RAZORPAY_KEY_ID,
    pricing: { subtotal, discount, total: amountInRupees },
    promo: salesPerson
      ? { code: promoConfig.code, salesPersonName: salesPerson.name }
      : null,
    plan,
    course: courses[0] ? { id: courses[0]._id, title: courses[0].title, price: courses[0].price } : null,
  });
}

// POST /api/payments/verify  { razorpay_order_id, razorpay_payment_id, razorpay_signature }
export async function verifyPayment(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (![razorpay_order_id, razorpay_payment_id, razorpay_signature].every((value) => typeof value === "string" && value.length > 0)) {
    return res.status(400).json({ message: "Missing payment verification fields" });
  }

  const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id, user: req.user._id });
  if (!payment) return res.status(404).json({ message: "Payment order not found" });

  const razorpay = getRazorpayClient();
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${payment.razorpayOrderId}|${razorpay_payment_id}`)
    .digest("hex");

  if (!/^[a-f0-9]{64}$/i.test(razorpay_signature) ||
      !crypto.timingSafeEqual(Buffer.from(expectedSignature, "hex"), Buffer.from(razorpay_signature, "hex"))) {
    return res.status(400).json({ message: "Payment verification failed" });
  }

  const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
  if (paymentDetails.order_id !== payment.razorpayOrderId ||
      paymentDetails.amount !== Math.round(payment.amount * 100) ||
      paymentDetails.currency !== payment.currency) {
    return res.status(400).json({ message: "Payment does not match this order" });
  }
  if (paymentDetails.status !== "captured") {
    return res.status(409).json({ message: "Payment is not captured yet. Please retry verification shortly." });
  }

  payment.status = "paid";
  // Provider time is stable across duplicate callbacks; verification must never extend access.
  payment.paidAt = payment.paidAt || new Date(paymentDetails.created_at * 1000);
  if (payment.planId && !payment.subscriptionExpiresAt) {
    payment.subscriptionExpiresAt = subscriptionExpiry(payment.paidAt, payment.billing);
  }
  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  payment.method = paymentDetails.method || "";
  await payment.save();

  // Enroll the student in every course from this order, not just one.
  const enrollments = [];
  for (const courseId of payment.courses) {
    enrollments.push(await enrollUserInCourse(req.user._id, courseId));
  }

  res.json({ message: payment.planId ? "Plan payment verified" : "Payment verified and enrollment complete", payment, enrollments });
}

// GET /api/payments/me
export async function myPayments(req, res) {
  const payments = await Payment.find({ user: req.user._id })
    .populate("courses", "title thumbnail price")
    .sort({ createdAt: -1 });
  res.json({ payments });
}
