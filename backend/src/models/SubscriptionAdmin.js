import mongoose from "mongoose";
export const SubscriptionLog = mongoose.model("SubscriptionLog", new mongoose.Schema({
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: String,
  details: String,
}, { timestamps: true }));
export const SubscriptionSettings = mongoose.model("SubscriptionSettings", new mongoose.Schema({
  key: { type: String, unique: true },
  expiringDays: { type: Number, default: 30 },
  defaultSessions: { type: Number, default: 5 },
}, { timestamps: true }));
