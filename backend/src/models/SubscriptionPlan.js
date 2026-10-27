import mongoose from "mongoose";
export default mongoose.model("SubscriptionPlan", new mongoose.Schema({
  planId: { type: String, enum: ["starter", "pro", "business"], unique: true },
  name: String, description: String, monthly: Number, yearly: Number,
  benefits: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true }));
