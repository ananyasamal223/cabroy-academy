import test from "node:test";
import assert from "node:assert/strict";
import StudentNotification from "../models/StudentNotification.js";
import MentorSession from "../models/MentorSession.js";
import { updateSessionStatus } from "./mentorSession.controller.js";
const id = "507f1f77bcf86cd799439011";
const mentor = "507f1f77bcf86cd799439012";
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; } });
test("assigned mentor approval saves the approved date and time", async t => {
  t.mock.method(StudentNotification, "updateOne", async () => ({}));
  let saved = false;
  const session = { _id: id, user: id, updatedAt: new Date(), mentor, date: new Date(Date.now() + 86400000), status: "pending", async save() { saved = true; } };
  t.mock.method(MentorSession, "findById", async () => session);
  const date = new Date(Date.now() + 172800000).toISOString();
  const res = response();
  await updateSessionStatus({ params: { id }, user: { _id: mentor, role: "instructor" }, body: { status: "confirmed", date } }, res);
  assert.equal(res.code, 200);
  assert.equal(saved, true);
  assert.equal(session.date.toISOString(), date);
  assert.equal(session.status, "confirmed");
});
test("unassigned instructors cannot approve another mentor's request", async t => {
  t.mock.method(MentorSession, "findById", async () => ({ mentor, status: "pending" }));
  const res = response();
  await updateSessionStatus({ params: { id }, user: { _id: id, role: "instructor" }, body: { status: "confirmed" } }, res);
  assert.equal(res.code, 403);
});
test("admins cannot approve a past date", async t => {
  t.mock.method(MentorSession, "findById", async () => ({ mentor, date: new Date(), status: "pending" }));
  const res = response();
  await updateSessionStatus({ params: { id }, user: { _id: id, role: "admin" }, body: { status: "confirmed", date: "2020-01-01" } }, res);
  assert.equal(res.code, 400);
});
