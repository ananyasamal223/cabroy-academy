import { randomUUID } from "node:crypto";
﻿import test from "node:test";
import assert from "node:assert/strict";
import process from "node:process";
import mongoose from "mongoose";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import AdminNotification from "../models/AdminNotification.js";
import { signToken } from "../utils/token.js";
import app from "../app.js";

test("Admin notification events, access and per-admin read receipts", { skip: process.env.AUTH_INTEGRATION !== "1", timeout: 120000 }, async t => {
 const dbName = "rathi_notifications_test_" + Date.now();
 const savedSecret = process.env.JWT_SECRET;
 process.env.JWT_SECRET = randomUUID();
 let server;
 try {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/rathi_academy", { dbName, serverSelectionTimeoutMS: 5000 });
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const origin = "http://127.0.0.1:" + server.address().port + "/api";
  const create = (name, role, extra = {}) => User.create({ name, email: name + "@example.test", password: randomUUID(), role, ...extra });
  const admin = await create("admin", "admin"), admin2 = await create("admin2", "admin"), student = await create("student", "student"), instructor = await create("mentor", "instructor");
  const staff = await create("staff", "employee", { adminAccess: true, adminPermissions: ["reports"] });
  const course = await Course.create({ title: "Notification Test", slug: "notification-test", instructor: instructor._id });
  await Enrollment.create({ user: student._id, course: course._id });
  const request = async (route, user = admin, method = "GET", body) => {
   const response = await fetch(origin + route, { method, headers: { "Content-Type": "application/json", ...(user ? { Authorization: "Bearer " + signToken(user) } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
   return { status: response.status, body: await response.json() };
  };
  await t.test("real project and mentor actions create alerts with useful links", async () => {
   assert.equal((await request(`/courses/${course._id}/projects`, student, "POST", { title: "My project" })).status, 201);
   assert.equal((await request("/mentor-sessions", student, "POST", { courseId: String(course._id), date: new Date(Date.now() + 86400000).toISOString() })).status, 201);
   const result = await request("/admin/notifications");
   assert.equal(result.body.unreadCount, 2);
   assert.ok(result.body.notifications.some(n => n.type === "project" && n.link.endsWith("?tab=projects")));
   assert.ok(result.body.notifications.some(n => n.type === "mentor" && n.link.endsWith("?tab=sessions")));
  });
  await t.test("instructor leave updates create alerts", async () => {
   assert.equal((await request(`/admin/instructors/${instructor._id}/status`, admin, "PATCH", { status: "on-leave", statusNote: "Away this week" })).status, 200);
   const notification = await AdminNotification.findOne({ type: "instructor" });
   assert.match(notification.message, /on-leave/);
   assert.equal(notification.title, "Instructor on leave");
  });
  await t.test("staff only see permitted alerts; students are forbidden", async () => {
   assert.equal((await request(`/feedback/course/${course._id}`, student, "PUT", { rating: 5, comment: "Helpful course", liked: [] })).status, 200);
   assert.equal((await request("/admin/notifications", null)).status, 401);
   assert.equal((await request("/admin/notifications", student)).status, 403);
   const result = await request("/admin/notifications", staff);
   assert.equal(result.body.notifications.length, 1);
   assert.equal(result.body.notifications[0].type, "feedback");
   const hidden = await AdminNotification.findOne({ type: "mentor" });
   await request("/admin/notifications/read", staff, "PATCH", { ids: [String(hidden._id)] });
   assert.equal((await AdminNotification.findById(hidden._id)).readBy.length, 0);
  });
  await t.test("read receipts persist per admin and mark-all is permission scoped", async () => {
   const before = await request("/admin/notifications");
   const id = before.body.notifications[0].id;
   assert.equal((await request("/admin/notifications/read", admin, "PATCH", { ids: ["invalid"] })).status, 400);
   assert.equal((await request("/admin/notifications/read", admin, "PATCH", { ids: [id] })).status, 200);
   assert.equal((await request("/admin/notifications")).body.unreadCount, 3);
   assert.equal((await request("/admin/notifications", admin2)).body.unreadCount, 4);
   await request("/admin/notifications/read", staff, "PATCH", { all: true });
   assert.equal((await request("/admin/notifications", staff)).body.unreadCount, 0);
   await request("/admin/notifications/read", admin, "PATCH", { all: true });
   assert.equal((await request("/admin/notifications")).body.unreadCount, 0);
   assert.equal((await request("/admin/notifications", admin2)).body.unreadCount, 4);
  });
 } finally {
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.name === dbName && /^rathi_notifications_test_\d+$/.test(dbName)) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (savedSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = savedSecret;
 }
});
