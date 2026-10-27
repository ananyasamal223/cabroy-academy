import test from "node:test";
import assert from "node:assert/strict";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import { getCourseMaterials } from "./course.controller.js";

async function request(t, role, enrolled, exists = true) {
  t.mock.method(Course, "findById", () => ({ select: async () => exists ? { _id: "course", instructor: "teacher", materialUrl: "https://docs.google.com/spreadsheets/d/example" } : null }));
  t.mock.method(Enrollment, "exists", async () => enrolled);
  const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
  await getCourseMaterials({ params: { id: "course" }, user: { _id: "learner", role } }, res);
  return res;
}
test("materials excluded from public queries", () => assert.equal(Course.schema.path("materialUrl").options.select, false));
test("unenrolled learner denied", async t => assert.equal((await request(t, "student", false)).code, 403));
test("enrolled learner allowed", async t => assert.match((await request(t, "student", true)).body.url, /^https:/));
test("admin allowed", async t => assert.match((await request(t, "admin", false)).body.url, /^https:/));
test("missing course returns 404", async t => assert.equal((await request(t, "student", true, false)).code, 404));
