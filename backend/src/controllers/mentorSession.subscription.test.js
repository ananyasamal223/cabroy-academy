import test from "node:test";
import assert from "node:assert/strict";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import MentorSession from "../models/MentorSession.js";
import { bookSubscriptionSession } from "./mentorSession.controller.js";
const id = "507f1f77bcf86cd799439011", userId = "507f1f77bcf86cd799439012";
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; } });
test("subscription booking uses the authenticated owner, saved mentor and allowance", async t => {
  const expiry = new Date(Date.now() + 30 * 86400000);
  t.mock.method(Payment, "findOne", async query => { assert.equal(query.user, userId); assert.equal(query.status, "paid"); return { _id: id, subscriptionExpiresAt: expiry, sessionsAllowed: 3, subscriptionMentor: userId }; });
  t.mock.method(User, "exists", async () => true);
  t.mock.method(MentorSession, "countDocuments", async () => 1);
  t.mock.method(MentorSession, "exists", async () => false);
  t.mock.method(MentorSession, "create", async data => { assert.equal(data.subscription, id); assert.equal(data.user, userId); assert.equal(data.mentor, userId); return data; });
  const res = response();
  await bookSubscriptionSession({ user: { _id: userId }, body: { subscriptionId: id, date: new Date(Date.now() + 86400000).toISOString() } }, res);
  assert.equal(res.code, 201);
});
test("unconfigured subscription allowances cannot be booked", async t => {
  t.mock.method(Payment, "findOne", async () => ({ subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000), sessionsAllowed: null }));
  const res = response();
  await bookSubscriptionSession({ user: { _id: userId }, body: { subscriptionId: id, date: new Date(Date.now() + 86400000).toISOString() } }, res);
  assert.equal(res.code, 409);
});
