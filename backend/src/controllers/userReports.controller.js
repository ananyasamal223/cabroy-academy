import User from "../models/User.js";
import Payment from "../models/Payment.js";
import Enrollment from "../models/Enrollment.js";
import { subscriptionRow } from "../utils/subscriptions.js";

export function buildUserReports(students, payments, enrollments, now = new Date()) {
  const byUser = new Map();
  const enrollmentMap = new Map();
  for (const payment of payments) {
    const id = String(payment.user);
    if (!byUser.has(id)) byUser.set(id, []);
    byUser.get(id).push(payment);
  }
  for (const enrollment of enrollments) {
    const id = String(enrollment.user);
    if (!enrollmentMap.has(id)) enrollmentMap.set(id, []);
    enrollmentMap.get(id).push(enrollment);
  }
  const rows = students.map(student => {
    const id = String(student._id);
    const purchases = (byUser.get(id) || []).sort((a, b) => new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt));
    const subscriptions = purchases.filter(p => p.planId).map(p => subscriptionRow(p, now));
    // A newer expired purchase must not hide another membership that is still active.
    const subscription = subscriptions.find(s => s.status === "active") || subscriptions[0] || null;
    const daysLeft = subscription ? Math.max(0, Math.ceil((new Date(subscription.expiresAt) - now) / 86400000)) : null;
    const status = !subscription ? "none" : subscription.status === "expired" ? "expired" : daysLeft <= 14 ? "expiring" : "active";
    const courses = [...new Map(purchases.flatMap(p => (p.courses || []).filter(Boolean).map(course => [String(course._id), { id: String(course._id), title: course.title }]))).values()];
    const learning = (enrollmentMap.get(id) || []).map(e => ({ id: String(e._id), courseId: e.course ? String(e.course._id) : null, course: e.course?.title || "Deleted course", status: e.status, enrolledAt: e.enrolledAt, mentorId: e.mentor ? String(e.mentor._id) : null, mentor: e.mentor?.name || "", mentorEmail: e.mentor?.email || "" }));
    const mentors = [...new Map(learning.filter(e => e.status !== "cancelled" && e.mentorId).map(e => [e.mentorId, { id: e.mentorId, name: e.mentor }])).values()];
    return { id, name: student.name, email: student.email, joinedAt: student.createdAt, isActive: student.isActive,
      courses, enrollments: learning, mentors, subscription, subscriptions, status, daysLeft,
      purchaseDate: purchases[0]?.paidAt || purchases[0]?.createdAt || null,
      purchaseDates: purchases.map(p => p.paidAt || p.createdAt),
      totalPaid: purchases.reduce((sum, p) => sum + Number(p.amount || 0), 0),
      payments: purchases.map(p => ({ id: String(p._id), date: p.paidAt || p.createdAt, amount: p.amount, orderId: p.razorpayOrderId, plan: p.planName || "", courses: (p.courses || []).filter(Boolean).map(c => c.title) })),
    };
  });
  rows.sort((a, b) => new Date(b.purchaseDate || b.joinedAt) - new Date(a.purchaseDate || a.joinedAt));
  return { rows, stats: { students: rows.length, subscribers: rows.filter(r => ["active", "expiring"].includes(r.status)).length, courses: payments.reduce((sum, p) => sum + (p.courses || []).filter(Boolean).length, 0), mentors: rows.filter(r => r.mentors.length).length } };
}

export async function userReports(req, res) {
  const payments = await Payment.find({ status: "paid" }).select("user courses planId planName billing amount paidAt subscriptionExpiresAt createdAt razorpayOrderId razorpayPaymentId method discount").populate("courses", "title").lean();
  const [students, enrollments, mentors] = await Promise.all([
    User.find({ $or: [{ role: "student" }, { _id: { $in: payments.map(p => p.user) } }] }).select("name email createdAt isActive").lean(),
    Enrollment.find({}).select("user course mentor status enrolledAt").populate("course", "title").populate("mentor", "name email").lean(),
    User.find({ role: "instructor", isActive: true, instructorStatus: { $ne: "inactive" } }).select("name email").sort({ name: 1 }).lean(),
  ]);
  const ids = new Set(students.map(s => String(s._id)));
  res.json({ ...buildUserReports(students, payments.filter(p => ids.has(String(p.user))), enrollments), mentors: mentors.map(m => ({ id: String(m._id), name: m.name, email: m.email })), updatedAt: new Date() });
}
