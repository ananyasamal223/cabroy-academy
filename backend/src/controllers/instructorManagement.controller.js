import mongoose from "mongoose";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Payment from "../models/Payment.js";
import Enrollment from "../models/Enrollment.js";
import MentorSession from "../models/MentorSession.js";
import { subscriptionRow } from "../utils/subscriptions.js";
export async function instructorManagement(req, res) {
  const { from, to } = req.query;
  const valid = d => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d;
  if ((from && !valid(from)) || (to && !valid(to)) || (from && to && from > to)) return res.status(400).json({ message: "Invalid date range" });
  const now = new Date();
  const inRange = date => (!from || new Date(date) >= new Date(`${from}T00:00:00Z`)) && (!to || new Date(date) <= new Date(`${to}T23:59:59.999Z`));
  const [instructors, courses, enrollments, sessions, payments] = await Promise.all([
    User.find({ role: "instructor" }).select("name email bio department instructorStatus isActive assignedCourses createdAt").lean(),
    Course.find({}).select("title instructor").lean(),
    Enrollment.find({ status: { $ne: "cancelled" } }).select("course mentor").lean(),
    MentorSession.find({ status: { $ne: "cancelled" } }).select("mentor course subscription date status").lean(),
    Payment.find({ status: "paid", planId: { $ne: null } }).select("user planId planName billing amount paidAt createdAt subscriptionExpiresAt subscriptionMentor sessionsAllowed razorpayOrderId").populate("user", "name email").populate("subscriptionMentor", "name").lean(),
  ]);
  const courseMap = new Map(courses.map(c => [String(c._id), c]));
  const rows = instructors.map(i => {
    const id = String(i._id);
    const assigned = new Set([...(i.assignedCourses || []).map(String), ...courses.filter(c => String(c.instructor) === id).map(c => String(c._id)), ...enrollments.filter(e => String(e.mentor) === id).map(e => String(e.course))]);
    return { id, name: i.name, email: i.email, department: i.department || i.bio || "Instructor", joinedAt: i.createdAt, status: i.isActive === false ? "inactive" : i.instructorStatus || "active", courses: [...assigned].filter(id => courseMap.has(id)).length, sessions: sessions.filter(s => String(s.mentor || courseMap.get(String(s.course))?.instructor) === id && s.status === "confirmed" && new Date(s.date) <= now && inRange(s.date)).length };
  });
  const subscriptions = payments.filter(p => inRange(p.paidAt || p.createdAt)).map(p => {
    const row = subscriptionRow(p, now);
    const used = sessions.filter(s => String(s.subscription) === String(p._id)).length;
    return { ...row, mentorId: p.subscriptionMentor ? String(p.subscriptionMentor._id) : "", mentorName: p.subscriptionMentor?.name || "Not Assigned", allowed: p.sessionsAllowed ?? null, used, remaining: p.sessionsAllowed == null ? null : Math.max(0, p.sessionsAllowed - used) };
  });
  res.json({ instructors: rows, subscriptions, updatedAt: now });
}
export async function updateSubscriptionMentorship(req, res) {
  const { mentorId, sessionsAllowed } = req.body;
  if (!mongoose.isValidObjectId(req.params.id) || (mentorId && !mongoose.isValidObjectId(mentorId)) || (sessionsAllowed !== undefined && sessionsAllowed !== null && (!Number.isInteger(sessionsAllowed) || sessionsAllowed < 0 || sessionsAllowed > 10000))) return res.status(400).json({ message: "Choose a valid mentor and a session allowance from 0 to 10000" });
  const payment = await Payment.findOne({ _id: req.params.id, status: "paid", planId: { $ne: null } });
  if (!payment) return res.status(404).json({ message: "Paid subscription not found" });
  if (mentorId && !await User.exists({ _id: mentorId, role: "instructor", isActive: true, instructorStatus: "active" })) return res.status(400).json({ message: "Choose an active instructor" });
  if (sessionsAllowed !== undefined && sessionsAllowed !== null) {
    const used = await MentorSession.countDocuments({ subscription: payment._id, status: { $ne: "cancelled" } });
    if (sessionsAllowed < used) return res.status(400).json({ message: `Allowance cannot be lower than the ${used} booked sessions` });
  }
  if (mentorId !== undefined) payment.subscriptionMentor = mentorId || null;
  if (sessionsAllowed !== undefined) payment.sessionsAllowed = sessionsAllowed;
  await payment.save();
  if (mentorId !== undefined) await MentorSession.updateMany({ subscription: payment._id, date: { $gte: new Date() }, status: { $ne: "cancelled" } }, { $set: { mentor: mentorId || null } });
  res.json({ message: "Subscription mentorship updated" });
}
