import test from "node:test";
import assert from "node:assert/strict";
import { buildUserReports, userReports } from "./userReports.controller.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import Enrollment from "../models/Enrollment.js";
const now = new Date("2026-09-29T00:00:00Z");
const students = [{ _id: "one", name: "First", email: "first@example.com", createdAt: "2026-01-01" }, { _id: "two", name: "Second", email: "second@example.com", createdAt: "2026-01-01" }];
const plan = { _id: "p", user: "one", planId: "pro", planName: "Pro", billing: "monthly", amount: 1999, createdAt: "2026-09-25", subscriptionExpiresAt: "2026-10-25", courses: [] };
test("reports includes admin purchasers and preserves both Pro and Business purchases", async t => {
  const admin = { _id: "admin", role: "admin", name: "Admin", createdAt: "2026-01-01" };
  const purchases = [{ ...plan, user: "admin" }, { ...plan, _id: "business", user: "admin", planId: "business", planName: "Business" }];
  const query = data => ({ select() { return this; }, populate() { return this; }, sort() { return this; }, lean: async () => data });
  t.mock.method(Payment, "find", () => query(purchases));
  t.mock.method(User, "find", filter => {
    if (!filter.$or) return query([]);
    assert.ok(filter.$or[1]._id.$in.includes("admin"));
    return query([...students, admin]);
  });
  t.mock.method(Enrollment, "find", () => query([]));
  let report;
  await userReports({}, { json(data) { report = data; } });
  assert.deepEqual(report.rows.find(row => row.id === "admin").subscriptions.map(s => s.planId).sort(), ["business", "pro"]);
});
test("includes students without purchases and plan-only buyers", () => {
  const report = buildUserReports(students, [plan], [], now);
  assert.equal(report.rows.length, 2);
  assert.equal(report.rows.find(r => r.id === "one").status, "active");
  assert.equal(report.rows.find(r => r.id === "two").status, "none");
  assert.deepEqual(report.stats, { students: 2, subscribers: 1, courses: 0, mentors: 0 });
});
test("groups course purchases without duplicates and keeps mentors specific to enrollments", () => {
  const course = { _id: "c", title: "Analytics" };
  const payment = { _id: "course-p", user: "one", amount: 500, createdAt: "2026-09-28", courses: [course] };
  const enrollment = { _id: "e", user: "one", course, mentor: { _id: "m", name: "Mentor" }, status: "active" };
  const report = buildUserReports(students, [plan, payment, { ...payment, _id: "repeat" }], [enrollment], now);
  const row = report.rows.find(r => r.id === "one");
  assert.equal(row.courses.length, 1);
  assert.equal(row.totalPaid, 2999);
  assert.equal(row.enrollments[0].courseId, "c");
  assert.equal(row.mentors[0].id, "m");
  assert.equal(report.stats.courses, 2);
  assert.equal(report.stats.mentors, 1);
});
test("expiry distinguishes expiring, expired and still-active memberships", () => {
  assert.equal(buildUserReports(students, [{ ...plan, subscriptionExpiresAt: "2026-10-08" }], [], now).rows[0].status, "expiring");
  assert.equal(buildUserReports(students, [{ ...plan, subscriptionExpiresAt: now }], [], now).rows[0].status, "expired");
  const rows = buildUserReports(students, [{ ...plan, _id: "old", createdAt: "2026-01-01", subscriptionExpiresAt: "2027-01-01" }, { ...plan, subscriptionExpiresAt: now }], [], now).rows;
  assert.equal(rows[0].subscription.id, "old");
  assert.equal(rows[0].status, "active");
});
test("endpoint queries verified payments and returns limited instructor data under reports permission", async t => {
  const query = data => ({ select() { return this; }, populate() { return this; }, sort() { return this; }, lean: async () => data });
  t.mock.method(User, "find", filter => query(filter.$or ? students : [{ _id: "m", name: "Mentor", email: "mentor@example.com" }]));
  t.mock.method(Payment, "find", filter => { assert.deepEqual(filter, { status: "paid" }); return query([plan, { ...plan, user: "deleted", _id: "orphan" }]); });
  t.mock.method(Enrollment, "find", () => query([]));
  let result;
  await userReports({}, { json: data => { result = data; } });
  assert.equal(result.rows.length, 2);
  assert.equal(result.mentors[0].id, "m");
  assert.equal(result.rows.reduce((sum, r) => sum + r.payments.length, 0), 1);
});
