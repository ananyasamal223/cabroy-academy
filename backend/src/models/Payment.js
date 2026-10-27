import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Array so one order can cover a cart of multiple courses, not just one.
    // This MUST stay "courses" (plural) — your real payment documents in
    // MongoDB already store it this way from the cart-checkout flow.
    courses: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    ],
    // Amount actually charged after any promo discount.
    amount: { type: Number, required: true },
    // Original order value before discount. Old payments may not have this field.
    subtotal: { type: Number, default: null },
    planId: { type: String, enum: ["starter", "pro", "business", null], default: null },
    planName: { type: String, default: "" },
    billing: { type: String, enum: ["monthly", "yearly", null], default: null },
    paidAt: { type: Date, default: null },
    subscriptionExpiresAt: { type: Date, default: null },
    subscriptionStartsAt: { type: Date, default: null },
    subscriptionMentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    sessionsAllowed: { type: Number, default: null, min: 0, validate: { validator: v => v === null || Number.isInteger(v), message: "Session allowance must be a whole number" } },
    discount: { type: Number, default: 0 },
    promoCode: { type: String, default: "", uppercase: true, trim: true, index: true },
    salesPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesPerson",
      default: null,
      index: true,
    },
    currency: { type: String, default: "INR" },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    method: { type: String, default: "" }, // upi / card / netbanking / wallet - filled in after verification
    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
