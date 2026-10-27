import Payment from "../models/Payment.js";
import { subscriptionExpiry } from "../utils/subscriptions.js";
const at = p => new Date(p.paidAt || p.createdAt);
export function revenueMetrics(payments, now = new Date()) {
  const paid = payments.filter(p => p.status === "paid");
  const totalRevenue = paid.reduce((sum, p) => sum + p.amount, 0);
  const subscriptionRevenue = paid.filter(p => p.planId).reduce((sum, p) => sum + p.amount, 0);
  return { totalRevenue, courseRevenue: totalRevenue - subscriptionRevenue, subscriptionRevenue,
    monthlyRevenue: paid.filter(p => p.planId && at(p) <= now && new Date(p.subscriptionExpiresAt || subscriptionExpiry(at(p), p.billing)) > now).reduce((sum, p) => sum + p.amount / (p.billing === "yearly" ? 12 : 1), 0),
    orders: paid.length, payers: new Set(paid.map(p => String(p.user?._id || p.user))).size, average: paid.length ? totalRevenue / paid.length : 0 };
}
export function topCourseRevenue(payments) {
  const courses = new Map();
  for (const p of payments.filter(p => p.status === "paid" && !p.planId)) {
    const items = p.courses || [];
    // Historical orders have no per-item price snapshot. Split the actual paid
    // amount evenly, preserving every paise and never counting the cart twice.
    const paise = Math.round(p.amount * 100);
    items.forEach((course, i) => {
      const id = String(course?._id || "deleted");
      const row = courses.get(id) || { id, title: course?.title || "Deleted course", thumbnail: course?.thumbnail || "", revenue: 0, purchases: 0 };
      row.revenue += (Math.floor(paise / items.length) + (i < paise % items.length ? 1 : 0)) / 100;
      row.purchases++; courses.set(id, row);
    });
  }
  return [...courses.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
}
export async function revenueOverview(req, res) {
  const { from, to, interval = "monthly", summary = "month", top = "month" } = req.query;
  const valid = d => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d;
  if ((from && !valid(from)) || (to && !valid(to)) || (from && to && from > to) || !["monthly", "daily"].includes(interval) || !["month", "year", "all"].includes(summary) || !["month", "year", "all"].includes(top)) return res.status(400).json({ message: "Invalid revenue filters" });
  const now = new Date();
  const end = to ? new Date(`${to}T23:59:59.999Z`) : now;
  const start = from ? new Date(`${from}T00:00:00.000Z`) : null;
  if (interval === "daily" && start && (end - start) / 86400000 > 366) return res.status(400).json({ message: "Choose a date range of up to 366 days for the daily chart." });
  const payments = await Payment.find({}).select("user courses amount status planId planName billing paidAt createdAt subscriptionExpiresAt razorpayOrderId razorpayPaymentId method discount").populate("user", "name email").populate("courses", "title thumbnail").lean();
  const range = payments.filter(p => (!start || at(p) >= start) && at(p) <= end);
  const period = key => range.filter(p => key === "all" || at(p) >= new Date(Date.UTC(end.getUTCFullYear(), key === "year" ? 0 : end.getUTCMonth(), 1)));
  const chartStart = start || (interval === "monthly" ? new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 11, 1)) : new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - 29)));
  const cursor = new Date(chartStart);
  if (interval === "monthly") cursor.setUTCDate(1);
  const series = [];
  while (cursor <= end && series.length < 600) {
    const key = cursor.toISOString().slice(0, interval === "monthly" ? 7 : 10);
    series.push({ key, label: cursor.toLocaleDateString("en-GB", { ...(interval === "daily" ? { day: "numeric" } : {}), month: "short", year: "2-digit", timeZone: "UTC" }), ...revenueMetrics(range.filter(p => at(p).toISOString().slice(0, key.length) === key), end) });
    if (interval === "monthly") cursor.setUTCMonth(cursor.getUTCMonth() + 1); else cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  res.json({ stats: revenueMetrics(range, end), summary: revenueMetrics(period(summary), end), series, topCourses: topCourseRevenue(period(top)), transactions: range.sort((a, b) => at(b) - at(a)).map(p => ({ id: String(p._id), name: p.user?.name || "Deleted customer", email: p.user?.email || "", type: p.planId ? "subscription" : "course", product: p.planId ? `${p.planName} Plan (${p.billing})` : (p.courses || []).map(c => c?.title || "Deleted course").join(", "), amount: p.amount, date: at(p), status: p.status, reference: p.razorpayPaymentId || p.razorpayOrderId, orderId: p.razorpayOrderId, method: p.method, discount: p.discount || 0 })), updatedAt: now });
}
