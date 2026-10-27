import test from "node:test";
import assert from "node:assert/strict";
import User from "../models/User.js";
import Enrollment from "../models/Enrollment.js";
import MentorSession from "../models/MentorSession.js";
import Project from "../models/Project.js";
import { assignEnrollmentMentor } from "./admin.controller.js";
import { authorizeAdminPermission } from "../middleware/auth.js";
test("mentor assignment updates only the requested student's course and related work", async t => {
  const mentor = { _id: "teacher", name: "Mentor" };
  t.mock.method(User, "findOne", filter => { assert.equal(filter.role, "instructor"); assert.equal(filter.isActive, true); return { select: async () => mentor }; });
  const enrollment = { user: "student", course: "course", mentor: null, async save() { assert.equal(this.mentor, "teacher"); } };
  t.mock.method(Enrollment, "findOne", async filter => { assert.deepEqual(filter, { user: "student", course: "course", status: { $ne: "cancelled" } }); return enrollment; });
  for (const model of [MentorSession, Project]) t.mock.method(model, "updateMany", async filter => { assert.equal(filter.user, "student"); assert.equal(filter.course, "course"); });
  let result;
  await assignEnrollmentMentor({ body: { mentorId: "teacher" }, params: { studentId: "student", courseId: "course" } }, { json: body => { result = body; } });
  assert.equal(result.mentor.id, "teacher");
});
test("reports permission does not require instructor-management access and rejects students", () => {
  const authorize = authorizeAdminPermission("reports");
  let passed = false;
  authorize({ user: { role: "employee", adminAccess: true, adminPermissions: ["reports"] } }, {}, () => { passed = true; });
  assert.equal(passed, true);
  let code;
  authorize({ user: { role: "student" } }, { status(value) { code = value; return this; }, json() {} }, () => assert.fail("Student must not access reports"));
  assert.equal(code, 403);
});
