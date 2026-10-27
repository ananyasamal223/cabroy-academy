import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Payment from "../models/Payment.js";
import { subscriptionRow, subscriptionSummary } from "../utils/subscriptions.js";

export async function dashboardOverview(req, res) {
  const { from, to, search = "", plan = "all", status = "all" } = req.query;
  const page = Number(req.query.page || 1);
  const months = Number(req.query.months || 6);
  const validDate = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if ((from && !validDate(from)) || (to && !validDate(to)) || (from && to && from > to) || !Number.isInteger(page) || page < 1 || ![3, 6, 12].includes(months) || !["all", "starter", "pro", "business"].includes(plan) || !["all", "active", "expired"].includes(status) || typeof search !== "string" || search.length > 200) {
    return res.status(400).json({ message: "Invalid dashboard filters" });
  }
  const now = new Date();
  const start = from ? new Date(`${from}T00:00:00.000Z`) : null;
  const end = to ? new Date(`${to}T23:59:59.999Z`) : now;
  const inRange = date => (!start || new Date(date) >= start) && new Date(date) <= end;
  const enrollmentFilter = { status: { $ne: "cancelled" }, ...(from || to ? { enrolledAt: { ...(start ? { $gte: start } : {}), $lte: end } } : {}) };
  const [totalStudents, activeCourses, enrollments, payments, recent] = await Promise.all([
    User.countDocuments({ role: "student" }), Course.countDocuments({ isPublished: true }),
    Enrollment.countDocuments(enrollmentFilter),
    Payment.find({ status: "paid" }).select("user planId planName billing amount paidAt subscriptionExpiresAt createdAt razorpayOrderId razorpayPaymentId method discount").populate("user", "name email").lean(),
    Enrollment.find(enrollmentFilter).sort({ enrolledAt: -1 }).limit(5).populate("user", "name email").populate("course", "title").lean(),
  ]);
  const subscriptions = payments.filter(p => p.planId).map(p => subscriptionRow(p, now));
  const filtered = subscriptions.filter(row => inRange(row.purchasedAt) && (plan === "all" || row.planId === plan) && (status === "all" || row.status === status) && `${row.name} ${row.email} ${row.orderId}`.toLowerCase().includes(search.trim().toLowerCase())).sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));
  const series = Array.from({ length: months }, (_, i) => {
    const date = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - months + 1 + i, 1));
    return { key: date.toISOString().slice(0, 7), label: date.toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" }), starter: 0, pro: 0, business: 0, courseRevenue: 0, subscriptionRevenue: 0, totalRevenue: 0 };
  });
  for (const payment of payments) {
    const paidAt = payment.paidAt || payment.createdAt;
    if (!inRange(paidAt)) continue;
    const bucket = series.find(row => row.key === new Date(paidAt).toISOString().slice(0, 7));
    if (!bucket) continue;
    bucket[payment.planId ? "subscriptionRevenue" : "courseRevenue"] += payment.amount;
    bucket.totalRevenue += payment.amount;
  }
  // Unique purchasers per plan per month, rather than counting repeat payments as new people.
  for (const bucket of series) for (const id of ["starter", "pro", "business"]) {
    bucket[id] = new Set(subscriptions.filter(row => row.planId === id && inRange(row.purchasedAt) && new Date(row.purchasedAt).toISOString().slice(0, 7) === bucket.key).map(row => row.userId)).size;
  }
  res.json({ stats: { totalStudents, activeCourses, enrollments, totalRevenue: payments.filter(p => inRange(p.paidAt || p.createdAt)).reduce((sum, p) => sum + p.amount, 0) },
    summary: subscriptionSummary(subscriptions, now), series,
    subscriptions: filtered.slice((page - 1) * 10, page * 10), totalSubscriptions: filtered.length, page,
    recentStudents: recent.map(e => ({ id: e._id, name: e.user?.name || "Deleted student", email: e.user?.email || "", course: e.course?.title || "Deleted course", joinDate: e.enrolledAt, status: e.status })),
    updatedAt: now,
  });
}
