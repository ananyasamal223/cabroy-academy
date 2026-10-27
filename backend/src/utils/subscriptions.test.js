import test from "node:test";
import assert from "node:assert/strict";
import { subscriptionExpiry, subscriptionRow, subscriptionSummary } from "./subscriptions.js";
test("billing expiry clamps to the last calendar day", () => {
  assert.equal(subscriptionExpiry("2026-01-31T12:00:00Z", "monthly").toISOString(), "2026-02-28T12:00:00.000Z");
  assert.equal(subscriptionExpiry("2024-02-29T12:00:00Z", "yearly").toISOString(), "2025-02-28T12:00:00.000Z");
  assert.equal(subscriptionExpiry("2026-12-10T12:00:00Z", "monthly").toISOString(), "2027-01-10T12:00:00.000Z");
});
test("legacy purchases expire exactly at the boundary", () => {
  const row = subscriptionRow({ _id: "p", user: { _id: "u" }, createdAt: "2026-08-29T00:00:00Z", billing: "monthly", planId: "pro" }, new Date("2026-09-29T00:00:00Z"));
  assert.equal(row.status, "expired");
  assert.equal(row.expiresAt.toISOString(), "2026-09-29T00:00:00.000Z");
});
test("stored dates are used and repeat purchases count customers once", () => {
  const now = new Date("2026-09-29T00:00:00Z");
  const row = subscriptionRow({ _id: "p", user: { _id: "u" }, planId: "pro", billing: "monthly", createdAt: "2025-01-01", paidAt: "2026-09-28", subscriptionExpiresAt: "2026-10-28" }, now);
  assert.equal(row.purchasedAt, "2026-09-28");
  assert.equal(row.status, "active");
  assert.deepEqual(subscriptionSummary([row, { ...row, id: "p2" }], now), { starter: 0, pro: 1, business: 0, active: 1, expiring: 1 });
});
