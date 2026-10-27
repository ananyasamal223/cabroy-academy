import test from "node:test";
import assert from "node:assert/strict";
import { revenueMetrics, topCourseRevenue, revenueOverview } from "./revenueOverview.controller.js";
test("only captured payments contribute revenue and yearly plans normalize over twelve months", () => {
  const rows = [{ status: "paid", user: "a", amount: 12000, planId: "pro", billing: "yearly", paidAt: "2026-01-01", subscriptionExpiresAt: "2027-01-01" }, { status: "paid", user: "a", amount: 500 }, { status: "failed", user: "b", amount: 999 }, { status: "created", user: "c", amount: 999 }];
  assert.deepEqual(revenueMetrics(rows, new Date("2026-09-01")), { totalRevenue: 12500, courseRevenue: 500, subscriptionRevenue: 12000, monthlyRevenue: 1000, orders: 2, payers: 1, average: 6250 });
});
test("cart allocation preserves the actual amount instead of double counting", () => {
  const top = topCourseRevenue([{ status: "paid", amount: 100.01, courses: [{ _id: "one", title: "One" }, { _id: "two", title: "Two" }] }]);
  assert.equal(top.reduce((sum, c) => sum + Math.round(c.revenue * 100), 0), 10001);
  assert.equal(top[0].revenue, 50.01);
});
test("invalid dates, periods and excessively large daily ranges are rejected", async () => {
  for (const query of [{ from: "2026-02-30" }, { interval: "bad" }, { summary: "bad" }, { from: "2026-10-01", to: "2026-01-01" }, { from: "2020-01-01", to: "2026-01-01", interval: "daily" }]) {
    let code;
    await revenueOverview({ query }, { status(value) { code = value; return this; }, json() {} });
    assert.equal(code, 400);
  }
});
