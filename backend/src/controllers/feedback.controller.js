import { notifyAdmins } from "../utils/adminNotifications.js";
import Feedback from "../models/Feedback.js";
import Enrollment from "../models/Enrollment.js";
import User from "../models/User.js";
import Course from "../models/Course.js";

const ALLOWED_LIKES = [
  "Content Quality",
  "Mentor Support",
  "Assignments",
  "Platform Experience",
];

function normalizeDateStart(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function normalizeDateEnd(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(23, 59, 59, 999);
  return date;
}

function percentageChange(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

async function buildAdminFilter(query = {}) {
  const conditions = [];
  const search = String(query.search || "").trim();
  const course = String(query.course || "").trim();
  const rating = Number(query.rating || 0);
  const status = String(query.status || "").trim().toLowerCase();
  const startDate = normalizeDateStart(query.startDate);
  const endDate = normalizeDateEnd(query.endDate);

  if (course && course !== "all") conditions.push({ course });
  if (Number.isInteger(rating) && rating >= 1 && rating <= 5) conditions.push({ rating });

  if (status === "pending") {
    conditions.push({ status: "pending" });
  } else if (status === "published") {
    conditions.push({ $or: [{ status: "published" }, { status: { $exists: false } }] });
  }

  if (startDate || endDate) {
    const createdAt = {};
    if (startDate) createdAt.$gte = startDate;
    if (endDate) createdAt.$lte = endDate;
    conditions.push({ createdAt });
  }

  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const [users, courses] = await Promise.all([
      User.find({ $or: [{ name: regex }, { email: regex }] }).select("_id").lean(),
      Course.find({ title: regex }).select("_id").lean(),
    ]);

    conditions.push({
      $or: [
        { comment: regex },
        { liked: regex },
        { user: { $in: users.map((item) => item._id) } },
        { course: { $in: courses.map((item) => item._id) } },
      ],
    });
  }

  return conditions.length ? { $and: conditions } : {};
}

async function getGrowthStats() {
  const now = new Date();
  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - 30);
  currentStart.setHours(0, 0, 0, 0);

  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - 30);

  const [current, previous] = await Promise.all([
    Feedback.find({ createdAt: { $gte: currentStart, $lte: now } }).select("rating user course").lean(),
    Feedback.find({ createdAt: { $gte: previousStart, $lt: currentStart } }).select("rating user course").lean(),
  ]);

  const average = (items) =>
    items.length ? items.reduce((sum, item) => sum + Number(item.rating || 0), 0) / items.length : 0;
  const unique = (items, key) => new Set(items.map((item) => String(item[key] || ""))).size;

  return {
    totalFeedbacks: percentageChange(current.length, previous.length),
    averageRating: percentageChange(average(current), average(previous)),
    uniqueStudents: percentageChange(unique(current, "user"), unique(previous, "user")),
    coursesReviewed: percentageChange(unique(current, "course"), unique(previous, "course")),
  };
}

export async function getPublicFeedback(req, res) {
  const limit = Math.min(12, Math.max(1, Number(req.query.limit) || 4));

  const items = await Feedback.find({
    $or: [{ status: "published" }, { status: { $exists: false } }],
  })
    .populate("user", "name avatar")
    .populate("course", "title")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json({
    items: items.map((item) => ({
      ...item,
      status: item.status || "published",
    })),
  });
}

export async function getMyCourseFeedback(req, res) {
  const feedback = await Feedback.findOne({
    user: req.user._id,
    course: req.params.courseId,
  });

  res.json({ feedback: feedback || null });
}

export async function upsertCourseFeedback(req, res) {
  const enrolled = await Enrollment.exists({
    user: req.user._id,
    course: req.params.courseId,
    status: { $ne: "cancelled" },
  });

  if (!enrolled) {
    return res.status(403).json({ message: "You can give feedback only for a purchased course." });
  }

  const rating = Number(req.body.rating);
  const comment = String(req.body.comment || "").trim();
  const liked = Array.isArray(req.body.liked)
    ? [...new Set(req.body.liked.filter((item) => ALLOWED_LIKES.includes(item)))]
    : [];

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Please select a rating from 1 to 5." });
  }

  if (!comment) {
    return res.status(400).json({ message: "Please write your feedback." });
  }

  if (comment.length > 500) {
    return res.status(400).json({ message: "Feedback cannot exceed 500 characters." });
  }

  const feedback = await Feedback.findOneAndUpdate(
    { user: req.user._id, course: req.params.courseId },
    { $set: { rating, liked, comment }, $setOnInsert: { status: "published" } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  await notifyAdmins({ type: "feedback", title: "Student feedback received", message: `${req.user.name} submitted a ${feedback.rating}-star course review.`, permission: "reports", link: "/admin/feedback" });
  res.json({ message: "Feedback submitted successfully.", feedback });
}

export async function getAdminFeedback(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 8));
  const filter = await buildAdminFilter(req.query);

  const [total, items, aggregateStats, courses, growth] = await Promise.all([
    Feedback.countDocuments(filter),
    Feedback.find(filter)
      .populate("user", "name email avatar")
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Feedback.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalFeedbacks: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          uniqueStudents: { $addToSet: "$user" },
          coursesReviewed: { $addToSet: "$course" },
        },
      },
    ]),
    Feedback.aggregate([
      { $group: { _id: "$course" } },
      { $lookup: { from: "courses", localField: "_id", foreignField: "_id", as: "course" } },
      { $unwind: "$course" },
      { $project: { _id: "$course._id", title: "$course.title" } },
      { $sort: { title: 1 } },
    ]),
    getGrowthStats(),
  ]);

  const rawStats = aggregateStats[0] || {};
  const stats = {
    totalFeedbacks: rawStats.totalFeedbacks || 0,
    averageRating: Number(rawStats.averageRating || 0).toFixed(1),
    uniqueStudents: rawStats.uniqueStudents?.length || 0,
    coursesReviewed: rawStats.coursesReviewed?.length || 0,
  };

  res.json({
    items: items.map((item) => ({ ...item, status: item.status || "published" })),
    stats,
    growth,
    courses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}

export async function exportAdminFeedback(req, res) {
  const filter = await buildAdminFilter(req.query);
  const items = await Feedback.find(filter)
    .populate("user", "name email")
    .populate("course", "title")
    .sort({ createdAt: -1 })
    .limit(10000)
    .lean();

  res.json({ items: items.map((item) => ({ ...item, status: item.status || "published" })) });
}

export async function updateFeedbackStatus(req, res) {
  const status = String(req.body.status || "").toLowerCase();
  if (!["published", "pending"].includes(status)) {
    return res.status(400).json({ message: "Status must be published or pending." });
  }

  const feedback = await Feedback.findByIdAndUpdate(
    req.params.feedbackId,
    { $set: { status } },
    { new: true, runValidators: true }
  )
    .populate("user", "name email avatar")
    .populate("course", "title");

  if (!feedback) return res.status(404).json({ message: "Feedback not found." });
  res.json({ message: "Feedback status updated.", feedback });
}

export async function deleteFeedback(req, res) {
  const feedback = await Feedback.findByIdAndDelete(req.params.feedbackId);
  if (!feedback) return res.status(404).json({ message: "Feedback not found." });
  res.json({ message: "Feedback deleted successfully." });
}
