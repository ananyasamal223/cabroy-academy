import { notifyStudent } from "../utils/studentNotifications.js";
import { notifyAdmins } from "../utils/adminNotifications.js";
import MentorSession from "../models/MentorSession.js";
import Enrollment from "../models/Enrollment.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { subscriptionExpiry } from "../utils/subscriptions.js";

// Each enrolled course gives the student this many mentor sessions per
// calendar month. Simple fixed constant for now - easy to later move to
// a per-course field on the Course model if different courses should
// offer different limits.
const MONTHLY_SESSION_LIMIT = 5;

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

async function countUsedThisMonth(userId, courseId) {
  const { start, end } = monthRange();
  return MentorSession.countDocuments({
    user: userId,
    course: courseId,
    status: { $ne: "cancelled" },
    date: { $gte: start, $lt: end },
  });
}

// GET /api/mentor-sessions/availability
// Returns each course the student is enrolled in, with how many mentor
// sessions they've used / have left this calendar month.
export async function getAvailability(req, res) {
  const enrollments = await Enrollment.find({
    user: req.user._id,
    status: { $ne: "cancelled" },
  }).populate("course", "title");

  const availability = await Promise.all(
    enrollments
      .filter((e) => e.course) // guard against a deleted course
      .map(async (e) => {
        const used = await countUsedThisMonth(req.user._id, e.course._id);
        return {
          courseId: e.course._id,
          courseTitle: e.course.title,
          limit: MONTHLY_SESSION_LIMIT,
          used,
          remaining: Math.max(0, MONTHLY_SESSION_LIMIT - used),
        };
      })
  );

  res.json({ availability });
}

// POST /api/mentor-sessions  { courseId, date, type?, note? }
export async function bookSession(req, res) {
  if (req.body.subscriptionId) return bookSubscriptionSession(req, res);
  const { courseId, date, type, note } = req.body;
  if (!courseId) return res.status(400).json({ message: "courseId is required" });
  if (!date) return res.status(400).json({ message: "date is required" });

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime()) || parsedDate <= new Date()) {
    return res.status(400).json({ message: "Invalid date" });
  }

  const enrollment = await Enrollment.findOne({
    user: req.user._id,
    course: courseId,
    status: { $ne: "cancelled" },
  })
    .populate("mentor", "_id")
    .populate("course", "instructor");
  if (!enrollment) {
    return res.status(403).json({ message: "You're not enrolled in this course" });
  }

  const used = await countUsedThisMonth(req.user._id, courseId);
  if (used >= MONTHLY_SESSION_LIMIT) {
    return res.status(429).json({
      message: `You've used all ${MONTHLY_SESSION_LIMIT} mentor sessions for this course this month`,
    });
  }

  const startOfDay = new Date(parsedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const existing = await MentorSession.findOne({
    user: req.user._id,
    date: { $gte: startOfDay, $lt: endOfDay },
    status: { $ne: "cancelled" },
  });
  if (existing) {
    return res.status(409).json({ message: "You already have a session requested on this date" });
  }

  const mentorCandidates = [...new Set([enrollment.mentor?._id, enrollment.course?.instructor].filter(Boolean).map(String))];
  let effectiveMentor = null;
  for (const candidate of mentorCandidates) {
    if (await User.exists({ _id: candidate, role: "instructor", isActive: true, instructorStatus: "active" })) {
      effectiveMentor = candidate;
      break;
    }
  }
  if (!effectiveMentor) return res.status(409).json({ message: "An active mentor must be assigned to this course before you can book a session. Please contact the academy." });

  const session = await MentorSession.create({
    user: req.user._id,
    course: courseId,
    mentor: effectiveMentor,
    date: parsedDate,
    type: type || "Live Doubt Session",
    note: note || "",
  });

  await notifyAdmins({ type: "mentor", title: "Mentor session requested", message: `${req.user.name} requested a session for ${session.date.toISOString()}.`, permission: session.mentor ? "instructors" : "reports", link: session.mentor ? `/admin/instructors/${session.mentor}?tab=sessions` : "/admin/user-overview" });
  res.status(201).json({ message: "Session requested", session });
}

// Explicitly link plan bookings to the purchased subscription; course bookings
// continue using their existing per-course monthly allowance.
export async function bookSubscriptionSession(req, res) {
  const { subscriptionId, date, type, note } = req.body;
  const scheduled = new Date(date);
  if (!mongoose.isValidObjectId(subscriptionId) || !date || Number.isNaN(scheduled.getTime()) || scheduled <= new Date()) return res.status(400).json({ message: "Choose a valid subscription and a future session date" });
  const payment = await Payment.findOne({ _id: subscriptionId, user: req.user._id, status: "paid", planId: { $ne: null } });
  if (!payment) return res.status(404).json({ message: "Subscription not found" });
  const expiry = payment.subscriptionExpiresAt || subscriptionExpiry(payment.paidAt || payment.createdAt, payment.billing);
  if (scheduled >= new Date(expiry)) return res.status(400).json({ message: "Choose a session date before your subscription expires" });
  if (payment.sessionsAllowed == null) return res.status(409).json({ message: "Contact the academy to configure your subscription session allowance" });
  if (!payment.subscriptionMentor || !await User.exists({ _id: payment.subscriptionMentor, role: "instructor", isActive: true, instructorStatus: "active" })) return res.status(409).json({ message: "An active subscription mentor must be assigned before booking" });
  const used = await MentorSession.countDocuments({ subscription: payment._id, status: { $ne: "cancelled" } });
  if (used >= payment.sessionsAllowed) return res.status(429).json({ message: "Your subscription session allowance has been used" });
  const day = new Date(scheduled); day.setUTCHours(0, 0, 0, 0);
  if (await MentorSession.exists({ user: req.user._id, status: { $ne: "cancelled" }, date: { $gte: day, $lt: new Date(day.getTime() + 86400000) } })) return res.status(409).json({ message: "You already have a session requested on this date" });
  const session = await MentorSession.create({ user: req.user._id, subscription: payment._id, mentor: payment.subscriptionMentor, date: scheduled, type: type || "Subscription Mentor Session", note: note || "" });
  await notifyAdmins({ type: "mentor", title: "Mentor session requested", message: `${req.user.name} requested a session for ${session.date.toISOString()}.`, permission: session.mentor ? "instructors" : "reports", link: session.mentor ? `/admin/instructors/${session.mentor}?tab=sessions` : "/admin/user-overview" });
  res.status(201).json({ message: "Subscription session requested", session });
}

// GET /api/mentor-sessions/me
export async function myMentorSessions(req, res) {
  const sessions = await MentorSession.find({
    user: req.user._id,
    status: { $ne: "cancelled" },
  })
    .populate("course", "title")
    .sort({ date: 1 });
  res.json({ sessions });
}

// DELETE /api/mentor-sessions/:id  (student cancels their own request)
export async function cancelSession(req, res) {
  const session = await MentorSession.findOne({ _id: req.params.id, user: req.user._id });
  if (!session) return res.status(404).json({ message: "Session not found" });
  session.status = "cancelled";
  await session.save();
  res.json({ message: "Session cancelled", session });
}

// GET /api/mentor-sessions  (admin/instructor - all requests)
export async function allMentorSessions(req, res) {
  const sessions = await MentorSession.find()
    .populate("user", "name email phone")
    .populate("course", "title")
    .populate("mentor", "name email")
    .sort({ date: 1 });
  res.json({ sessions });
}

// PATCH /api/mentor-sessions/:id  (admin/instructor - confirm/cancel)
export async function updateSessionStatus(req, res) {
  const { status } = req.body;
  if (!["pending", "confirmed", "cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid session ID" });
  const session = await MentorSession.findById(req.params.id);
  if (!session) return res.status(404).json({ message: "Session not found" });
  if (req.user.role === "instructor") {
    let mentorId = session.mentor;
    if (!mentorId && session.course) {
      const enrollment = await Enrollment.findOne({ user: session.user, course: session.course, status: { $ne: "cancelled" } }).populate("course", "instructor");
      mentorId = enrollment?.mentor || enrollment?.course?.instructor;
    }
    if (String(mentorId) !== String(req.user._id)) return res.status(403).json({ message: "You can only manage your assigned sessions" });
  }
  const previousStatus = session.status;
  const previousDate = new Date(session.date).getTime();
  const approvedDate = req.body.date !== undefined ? new Date(req.body.date) : new Date(session.date);
  if (status === "confirmed" || req.body.date !== undefined) {
    if (Number.isNaN(approvedDate.getTime()) || approvedDate <= new Date()) return res.status(400).json({ message: "Choose a valid future session date and time" });
    if (session.subscription) {
      const payment = await Payment.findById(session.subscription);
      if (!payment || approvedDate >= new Date(payment.subscriptionExpiresAt || subscriptionExpiry(payment.paidAt || payment.createdAt, payment.billing))) return res.status(400).json({ message: "The approved date must be within the subscription period" });
    }
    session.date = approvedDate;
  }
  session.status = status;
  await session.save();
  if (previousStatus !== status || previousDate !== new Date(session.date).getTime()) await notifyStudent({ user: session.user, eventKey: "session:" + session._id + ":" + session.updatedAt.toISOString(), type: "mentor", title: "Mentor session " + status, message: "Your mentor session is " + status + ". Scheduled time: " + session.date.toISOString(), link: "/community" });
  res.json({ message: "Session updated", session });
}
