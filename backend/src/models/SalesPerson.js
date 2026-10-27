import mongoose from "mongoose";

const promoCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    discountPercent: { type: Number, default: 10, min: 0, max: 100 },
    maxDiscount: { type: Number, default: 500, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const salesPersonSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },

    // Legacy primary code fields are intentionally kept so existing pages/data
    // continue to work. promoCodes contains every code assigned to the rep.
    promoCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    discountPercent: { type: Number, default: 10, min: 0, max: 100 },
    maxDiscount: { type: Number, default: 500, min: 0 },
    promoCodes: { type: [promoCodeSchema], default: [] },

    isActive: { type: Boolean, default: true },
    removedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Enforce uniqueness for all new multi-code records.
salesPersonSchema.index({ "promoCodes.code": 1 }, { unique: true, sparse: true });

salesPersonSchema.pre("save", function normalizePromos(next) {
  if (this.promoCode) this.promoCode = String(this.promoCode).trim().toUpperCase();

  if (Array.isArray(this.promoCodes)) {
    this.promoCodes = this.promoCodes
      .filter((p) => p && p.code)
      .map((p) => ({
        code: String(p.code).trim().toUpperCase(),
        discountPercent: Number(p.discountPercent ?? 10),
        maxDiscount: Number(p.maxDiscount ?? 500),
        isActive: p.isActive !== false,
      }));
  }

  // Existing sales records may only have the legacy promoCode fields.
  if (!this.promoCodes?.length && this.promoCode) {
    this.promoCodes = [{
      code: this.promoCode,
      discountPercent: Number(this.discountPercent ?? 10),
      maxDiscount: Number(this.maxDiscount ?? 500),
      isActive: this.isActive !== false,
    }];
  } else if (this.isModified("promoCodes") && this.promoCodes?.length) {
    // First code remains the backwards-compatible primary code.
    const first = this.promoCodes[0];
    this.promoCode = first.code;
    this.discountPercent = first.discountPercent;
    this.maxDiscount = first.maxDiscount;
  } else if (
    this.promoCodes?.length &&
    (this.isModified("promoCode") || this.isModified("discountPercent") || this.isModified("maxDiscount"))
  ) {
    this.promoCodes[0] = {
      ...this.promoCodes[0],
      code: this.promoCode,
      discountPercent: Number(this.discountPercent ?? 10),
      maxDiscount: Number(this.maxDiscount ?? 500),
    };
  }

  next();
});

export default mongoose.model("SalesPerson", salesPersonSchema);
