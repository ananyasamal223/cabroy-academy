import test from "node:test";
import assert from "node:assert/strict";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import { SubscriptionSettings, SubscriptionLog } from "../models/SubscriptionAdmin.js";
import { createSubscriber, editSubscriber, saveSubscriptionSettings } from "./subscriptionManagement.controller.js";
const id = "507f1f77bcf86cd799439011";
const res = () => ({ code: 200, status(c) { this.code = c; return this; }, json(v) { this.body = v; } });
test("manual subscriber creation uses a registered student and keeps payment pending", async t => {
  t.mock.method(User, "findOne", async query => { assert.equal(query.role, "student"); assert.equal(query.email, "student@test.com"); return { _id: id, email: query.email }; });
  t.mock.method(SubscriptionSettings, "findOne", async () => ({ defaultSessions: 4 }));
  t.mock.method(Payment, "create", async row => { assert.equal(row.status, "created"); assert.equal(row.user, id); assert.equal(row.sessionsAllowed, 4); assert.equal(row.amount, 999); assert.equal(row.subscriptionStartsAt.toISOString().slice(0, 10), "2026-10-01"); return { _id: id }; });
  t.mock.method(SubscriptionLog, "create", async () => ({}));
  const response = res();
  await createSubscriber({ user: { _id: id }, body: { email: "Student@test.com", planId: "starter", billing: "monthly", amount: 999, startDate: "2026-10-01" } }, response);
  assert.equal(response.code, 201);
});
test("invalid manual subscriptions are rejected before database writes", async () => {
  const response = res();
  await createSubscriber({ body: { planId: "fake", amount: -3 } }, response);
  assert.equal(response.code, 400);
});
test("unknown student emails cannot create subscriptions", async t => {
  t.mock.method(User, "findOne", async () => null);
  const response = res();
  await createSubscriber({ body: { email: "missing@test.com", planId: "pro", billing: "yearly", amount: 1000, startDate: "2026-10-01" } }, response);
  assert.equal(response.code, 404);
});
test("settings reject invalid thresholds and allowances", async () => {
  const response = res();
  await saveSubscriptionSettings({ body: { expiringDays: 0, defaultSessions: -1 } }, response);
  assert.equal(response.code, 400);
});
test("editing requires a valid subscription identifier", async () => {
  const response = res();
  await editSubscriber({ params: { id: "bad" }, body: {} }, response);
  assert.equal(response.code, 400);
});
