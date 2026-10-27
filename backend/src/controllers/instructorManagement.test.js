import test from "node:test";
import assert from "node:assert/strict";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import MentorSession from "../models/MentorSession.js";
import { updateSubscriptionMentorship, instructorManagement } from "./instructorManagement.controller.js";
const id = "507f1f77bcf86cd799439011", mentorId = "507f1f77bcf86cd799439012";
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(data) { this.body = data; } });
test("reassignment persists mentor and allowance and only updates that subscription's upcoming sessions", async t => {
  let saved = false, updated;
  const payment = { _id: id, async save() { saved = true; } };
  t.mock.method(Payment, "findOne", async q => { assert.equal(q.status, "paid"); return payment; });
  t.mock.method(User, "exists", async q => { assert.equal(q.instructorStatus, "active"); return true; });
  t.mock.method(MentorSession, "countDocuments", async () => 2);
  t.mock.method(MentorSession, "updateMany", async (query, patch) => { updated = { query, patch }; });
  const res = response();
  await updateSubscriptionMentorship({ params: { id }, body: { mentorId, sessionsAllowed: 8 } }, res);
  assert.equal(saved, true); assert.equal(payment.subscriptionMentor, mentorId); assert.equal(payment.sessionsAllowed, 8);
  assert.equal(updated.query.subscription, id); assert.ok(updated.query.date.$gte instanceof Date); assert.equal(updated.patch.$set.mentor, mentorId);
});
test("used allowance cannot be reduced below existing bookings", async t => {
  t.mock.method(Payment, "findOne", async () => ({ _id: id, save() { assert.fail("Must not save invalid allowance"); } }));
  t.mock.method(MentorSession, "countDocuments", async () => 4);
  const res = response(); await updateSubscriptionMentorship({ params: { id }, body: { sessionsAllowed: 2 } }, res); assert.equal(res.code, 400);
});
test("inactive mentors and invalid input are rejected", async t => {
  t.mock.method(Payment, "findOne", async () => ({ _id: id }));
  t.mock.method(User, "exists", async () => false);
  for (const body of [{ mentorId }, { sessionsAllowed: -1 }, { sessionsAllowed: 1.5 }, { mentorId: "bad" }]) { const res = response(); await updateSubscriptionMentorship({ params: { id }, body }, res); assert.equal(res.code, 400); }
});
test("invalid date filters are rejected", async () => {
  const res = response(); await instructorManagement({ query: { from: "2026-02-30" } }, res); assert.equal(res.code, 400);
});
