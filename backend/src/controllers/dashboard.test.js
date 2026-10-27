import test from "node:test";
import assert from "node:assert/strict";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Payment from "../models/Payment.js";
import { dashboardOverview } from "./dashboard.controller.js";
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; } });
const query = rows => ({ select() { return this; }, populate() { return this; }, sort() { return this; }, limit() { return this; }, lean: async () => rows });
test("overview includes only paid orders, separates revenue and filters customers", async t => {
  t.mock.method(User, "countDocuments", async () => 2);
  t.mock.method(Course, "countDocuments", async () => 1);
  t.mock.method(Enrollment, "countDocuments", async () => 1);
  t.mock.method(Enrollment, "find", () => query([]));
  t.mock.method(Payment, "find", filter => {
    assert.deepEqual(filter, { status: "paid" });
    return query([
      { _id: "p1", user: { _id: "u1", name: "Ananya", email: "a@example.com" }, planId: "pro", billing: "monthly", amount: 1999, createdAt: "2026-09-26", subscriptionExpiresAt: "2026-10-26" },
      { _id: "p2", user: { _id: "u2", name: "Rahul" }, amount: 500, createdAt: "2026-09-25" },
      { _id: "p3", user: { _id: "u1", name: "Ananya" }, planId: "pro", billing: "monthly", amount: 1999, createdAt: "2026-08-01" },
    ]);
  });
  const res = response();
  await dashboardOverview({ query: { from: "2026-09-01", to: "2026-09-30", search: "ananya" } }, res);
  assert.equal(res.body.stats.totalRevenue, 2499);
  assert.equal(res.body.totalSubscriptions, 1);
  assert.equal(res.body.subscriptions[0].id, "p1");
  const september = res.body.series.find(row => row.key === "2026-09");
  assert.equal(september.pro, 1);
  assert.equal(september.courseRevenue, 500);
  assert.equal(september.subscriptionRevenue, 1999);
});
test("invalid calendar dates, ranges, periods and pages are rejected", async () => {
  for (const query of [{ from: "2026-09-30", to: "2026-09-01" }, { from: "2026-02-30" }, { page: "-1" }, { months: "999" }, { plan: "unknown" }]) {
    const res = response();
    await dashboardOverview({ query }, res);
    assert.equal(res.code, 400);
  }
});
