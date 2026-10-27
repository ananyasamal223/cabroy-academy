import { randomUUID } from "node:crypto";
﻿import test from "node:test";
import assert from "node:assert/strict";
import process from "node:process";
import mongoose from "mongoose";
import User from "../models/User.js";
import app from "../app.js";
import { signToken } from "../utils/token.js";
import { normalizeLiveCourse } from "../../../frontend/src/utils/liveCourses.js";
import { getProgramPrice } from "../../../frontend/src/utils/courseBundle.js";

test("live course mapping preserves backend identity, curriculum, image and price", () => {
 const raw = { _id: "507f1f77bcf86cd799439011", slug: "new-course", title: "New Course", price: 1234, originalPrice: 2000, category: "Data Analytics", thumbnail: "/uploads/new.png", skills: ["SQL"], curriculum: [{ title: "Introduction", submodules: ["SQL basics"] }], projects: [{ title: "Analysis" }], description: "Full description", shortDescription: "Summary" };
 const course = normalizeLiveCourse(raw, "https://academy.example/api");
 assert.equal(course.id, raw._id);
 assert.equal(course.image, "https://academy.example/uploads/new.png");
 assert.equal(course.price, 1234);
 assert.equal(course.categoryGroup, "Analytics");
 assert.equal(course.fullDescription, "Full description");
 assert.deepEqual(course.modules, ["Introduction"]);
 assert.deepEqual(course.curriculum[0].submodules, ["SQL basics"]);
 assert.equal(getProgramPrice([course, { ...course, price: 500 }, { ...course, price: 750 }]), 2484);
 assert.deepEqual(normalizeLiveCourse({ _id: raw._id, title: "Empty", price: 0 }).curriculum, []);
});

test("admin-created courses become public after publishing and show edits", { skip: process.env.COURSE_CATALOG_INTEGRATION !== "1", timeout: 60000 }, async () => {
 const dbName = "rathi_catalog_test_" + Date.now();
 const oldSecret = process.env.JWT_SECRET;
 process.env.JWT_SECRET = randomUUID();
 let server;
 try {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/rathi_academy", { dbName, serverSelectionTimeoutMS: 5000 });
  const admin = await User.create({ name: "Test Admin", email: "admin@example.test", password: randomUUID(), role: "admin" });
  const token = signToken(admin);
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const origin = "http://127.0.0.1:" + server.address().port + "/api";
  const request = async (route, method = "GET", body) => {
   const response = await fetch(origin + route, { method, headers: { "Content-Type": "application/json", ...(method !== "GET" ? { Authorization: "Bearer " + token } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
   return { status: response.status, data: await response.json() };
  };
  const created = await request("/courses", "POST", { title: "Brand New Course", slug: "brand-new-course", price: 2500, isPublished: false, curriculum: [{ title: "Module One", submodules: ["Topic One"] }], skills: ["A real skill"] });
  assert.equal(created.status, 201);
  const id = created.data.course._id;
  assert.equal((await request("/courses?published=true")).data.courses.length, 0);
  assert.equal((await request(`/courses/${id}`, "PATCH", { isPublished: true })).status, 200);
  const listed = (await request("/courses?published=true")).data.courses;
  assert.equal(listed.length, 1);
  assert.equal(listed[0]._id, id);
  const detail = await request("/courses/brand-new-course");
  assert.equal(detail.status, 200);
  assert.equal(normalizeLiveCourse(detail.data.course).id, id);
  assert.equal(detail.data.course.curriculum[0].submodules[0], "Topic One");
  await request(`/courses/${id}`, "PATCH", { title: "Updated Course", price: 3500 });
  const updated = (await request(`/courses/${id}`)).data.course;
  assert.equal(updated.title, "Updated Course"); assert.equal(updated.price, 3500);
  await request(`/courses/${id}`, "PATCH", { isPublished: false });
  assert.equal((await request("/courses?published=true")).data.courses.length, 0);
 } finally {
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.name === dbName && /^rathi_catalog_test_\d+$/.test(dbName)) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (oldSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = oldSecret;
 }
});
