import "dotenv/config";
import process from "node:process";
import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const payments = await Payment.find({ status: "paid", planId: { $ne: null } }).select("user planName").populate("user", "name role").lean();
  console.log(JSON.stringify(payments.map(p => ({ plan: p.planName, account: p.user?.name || "Deleted account", role: p.user?.role })), null, 2));
  console.log("Akshita account exists:", Boolean(await User.exists({ name: /akshita/i })));
} finally { await mongoose.disconnect(); }
