import { randomUUID } from "node:crypto";
﻿import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import process from "node:process";
import app from "../app.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Project from "../models/Project.js";
import MentorSession from "../models/MentorSession.js";
import Progress from "../models/Progress.js";
import StudentNotification from "../models/StudentNotification.js";
import { enrollUserInCourse } from "../utils/enrollUser.js";
import { signToken } from "../utils/token.js";

test("student notification events, isolation and persistent read status", { skip: process.env.AUTH_INTEGRATION !== "1", timeout: 120000 }, async t => {
 const dbName = "rathi_student_notifications_test_" + Date.now();
 const secret = process.env.JWT_SECRET;
 process.env.JWT_SECRET = randomUUID();
 let server;
 try {
  await mongoose.connect("mongodb://127.0.0.1:27017/" + dbName, { serverSelectionTimeoutMS: 5000 });
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const origin = "http://127.0.0.1:" + server.address().port + "/api";
  const create = (name, role) => User.create({ name, email: name + "@example.test", password: randomUUID(), role });
  const student = await create("student", "student"), other = await create("other", "student"), admin = await create("admin", "admin");
  const course = await Course.create({ title: "Notification course", slug: "notification-course", instructor: admin._id });
  const request = async (route, user = student, method = "GET", body) => {
   const response = await fetch(origin + route, { method, headers: { "Content-Type": "application/json", ...(user ? { Authorization: "Bearer " + signToken(user) } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
   return { status: response.status, body: await response.json() };
  };
  await t.test("new accounts have no dummy alerts; endpoints require authentication", async () => {
   assert.equal((await request("/users/me/notifications", null)).status, 401);
   assert.deepEqual((await request("/users/me/notifications", admin)).body, { notifications: [], unreadCount: 0 });
   assert.deepEqual((await request("/users/me/notifications")).body, { notifications: [], unreadCount: 0 });
  });
  await t.test("enrollment creates one alert even on repeated enrollment", async () => {
   await enrollUserInCourse(student._id, course._id);
   await enrollUserInCourse(student._id, course._id);
   assert.equal(await StudentNotification.countDocuments({ user: student._id }), 1);
  });
  await t.test("mentor updates and project reviews notify the correct student", async () => {
   const session = await MentorSession.create({ user: student._id, course: course._id, date: new Date(Date.now() + 86400000) });
   assert.equal((await request("/mentor-sessions/" + session._id, admin, "PATCH", { status: "confirmed" })).status, 200);
   assert.equal((await request("/mentor-sessions/" + session._id, admin, "PATCH", { status: "confirmed" })).status, 200);
   const project = await Project.create({ user: student._id, course: course._id, title: "Test project" });
   assert.equal((await request("/projects/" + project._id + "/review", admin, "PATCH", { status: "approved", feedback: "Well done" })).status, 200);
   assert.equal((await request("/users/me/notifications")).body.unreadCount, 3);
   assert.equal((await request("/users/me/notifications", other)).body.unreadCount, 0);
  });
  await t.test("certificate issuance creates a deduplicated certificate alert", async () => {
   await Progress.create({ user: student._id, course: course._id, percentage: 100 });
   assert.equal((await request("/courses/" + course._id + "/certificate", student, "POST")).status, 201);
   assert.equal((await request("/courses/" + course._id + "/certificate", student, "POST")).status, 201);
   assert.equal((await request("/users/me/notifications")).body.unreadCount, 4);
  });
  await t.test("read status persists; other users cannot mark another student's notifications", async () => {
   const before = await request("/users/me/notifications");
   const id = before.body.notifications[0].id;
   assert.equal((await request("/users/me/notifications/read", student, "PATCH", { ids: ["invalid"] })).status, 400);
   await request("/users/me/notifications/read", other, "PATCH", { ids: [id] });
   assert.equal((await request("/users/me/notifications")).body.unreadCount, 4);
   await request("/users/me/notifications/read", student, "PATCH", { ids: [id] });
   assert.equal((await request("/users/me/notifications")).body.unreadCount, 3);
   assert.equal((await request("/users/me/notifications")).body.notifications.find(n => n.id === id).read, true);
   await request("/users/me/notifications/read", student, "PATCH", { all: true });
   assert.equal((await request("/users/me/notifications")).body.unreadCount, 0);
  });
 } finally {
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.name === dbName && /^rathi_student_notifications_test_\d+$/.test(dbName)) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secret;
 }
});


