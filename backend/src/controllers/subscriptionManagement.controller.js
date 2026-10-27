import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import MentorSession from "../models/MentorSession.js";
import { SubscriptionLog, SubscriptionSettings } from "../models/SubscriptionAdmin.js";
import { subscriptionRow, subscriptionExpiry } from "../utils/subscriptions.js";

export async function listSubscriptions(req, res) {
  const [payments, mentors, settings, logs] = await Promise.all([
    Payment.find({ planId: { $in: ["starter", "pro", "business"] } }).populate("user", "name email").populate("subscriptionMentor", "name").sort({ createdAt: -1 }).lean(),
    User.find({ role: "instructor", isActive: true, instructorStatus: "active" }).select("name email").lean(),
    SubscriptionSettings.findOne({ key: "default" }).lean(),
    SubscriptionLog.find().populate("actor", "name").sort({ createdAt: -1 }).limit(200).lean(),
  ]);
  const now = new Date();
  const config = { expiringDays: settings?.expiringDays ?? 30, defaultSessions: settings?.defaultSessions ?? 5 };
  const rows = payments.map(p => {
    const row = subscriptionRow(p, now);
    const status = p.status === "failed" ? "failed" : p.status !== "paid" ? "pending" : row.status === "active" && new Date(row.expiresAt) <= new Date(now.getTime() + config.expiringDays * 86400000) ? "expiring" : row.status;
    return { ...row, status, paymentStatus: p.status, mentorId: String(p.subscriptionMentor?._id || ""), mentorName: p.subscriptionMentor?.name || "Not assigned", sessionsAllowed: p.sessionsAllowed };
  });
  res.json({ subscriptions: rows, mentors, settings: config, logs });
}

export async function createSubscriber(req, res) {
  const { email, planId, billing, amount, startDate, mentorId } = req.body;
  if (!["starter", "pro", "business"].includes(planId) || !["monthly", "yearly"].includes(billing) || !Number.isFinite(Number(amount)) || Number(amount) < 0 || !startDate || Number.isNaN(Date.parse(startDate))) return res.status(400).json({ message: "Enter a valid plan, billing cycle, amount and start date" });
  const user = await User.findOne({ email: String(email || "").trim().toLowerCase(), role: "student" });
  if (!user) return res.status(404).json({ message: "No registered student found with this email" });
  if (mentorId && (!mongoose.isValidObjectId(mentorId) || !await User.exists({ _id: mentorId, role: "instructor", isActive: true, instructorStatus: "active" }))) return res.status(400).json({ message: "Choose an active mentor" });
  const settings = await SubscriptionSettings.findOne({ key: "default" });
  const payment = await Payment.create({ user: user._id, courses: [], planId, planName: planId[0].toUpperCase() + planId.slice(1), billing, amount: Number(amount), razorpayOrderId: `manual_${randomUUID()}`, status: "created", subscriptionStartsAt: new Date(startDate), subscriptionExpiresAt: subscriptionExpiry(startDate, billing), subscriptionMentor: mentorId || null, sessionsAllowed: settings?.defaultSessions ?? 5 });
  await SubscriptionLog.create({ subscription: payment._id, actor: req.user._id, action: "Subscriber added", details: `${user.email} · ${planId} · pending payment` });
  res.status(201).json({ message: "Subscriber added with pending payment" });
}

export async function editSubscriber(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid subscription" });
  const payment = await Payment.findOne({ _id: req.params.id, planId: { $in: ["starter", "pro", "business"] } });
  if (!payment) return res.status(404).json({ message: "Subscription not found" });
  const { mentorId, sessionsAllowed, expiresAt } = req.body;
  if (mentorId !== undefined && mentorId && (!mongoose.isValidObjectId(mentorId) || !await User.exists({ _id: mentorId, role: "instructor", isActive: true, instructorStatus: "active" }))) return res.status(400).json({ message: "Choose an active mentor" });
  if (!Number.isInteger(sessionsAllowed) || sessionsAllowed < 0 || sessionsAllowed > 10000 || !expiresAt || Number.isNaN(Date.parse(expiresAt))) return res.status(400).json({ message: "Enter a valid expiry date and whole session allowance" });
  const used = await MentorSession.countDocuments({ subscription: payment._id, status: { $ne: "cancelled" } });
  if (sessionsAllowed < used) return res.status(400).json({ message: `Allowance cannot be below ${used} booked sessions` });
  payment.subscriptionMentor = mentorId || null;
  payment.sessionsAllowed = sessionsAllowed;
  payment.subscriptionExpiresAt = new Date(expiresAt);
  await payment.save();
  await MentorSession.updateMany({ subscription: payment._id, date: { $gte: new Date() }, status: { $ne: "cancelled" } }, { $set: { mentor: mentorId || null } });
  await SubscriptionLog.create({ subscription: payment._id, actor: req.user._id, action: "Subscription updated", details: `Expiry ${payment.subscriptionExpiresAt.toISOString()} · ${sessionsAllowed} sessions` });
  res.json({ message: "Subscription updated" });
}

export async function saveSubscriptionSettings(req, res) {
  const { expiringDays, defaultSessions } = req.body;
  if (!Number.isInteger(expiringDays) || expiringDays < 1 || expiringDays > 365 || !Number.isInteger(defaultSessions) || defaultSessions < 0 || defaultSessions > 10000) return res.status(400).json({ message: "Enter valid expiry threshold (1–365 days) and session allowance (0–10000)" });
  await SubscriptionSettings.findOneAndUpdate({ key: "default" }, { expiringDays, defaultSessions }, { upsert: true, runValidators: true });
  await SubscriptionLog.create({ actor: req.user._id, action: "Settings updated", details: `${expiringDays} day expiry threshold · ${defaultSessions} default sessions` });
  res.json({ message: "Settings saved" });
}
