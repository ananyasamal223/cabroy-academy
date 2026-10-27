import test from "node:test";
import assert from "node:assert/strict";
import Certificate from "../models/Certificate.js";
import { adminCertificates } from "./certificate.controller.js";
import { authorizeAdminPermission } from "../middleware/auth.js";

test("admin directory returns stored certificates with student and course details", async t => {
  const rows = [{ _id: "record", certificateId: "RA-real", user: { name: "Learner", email: "learner@example.com" }, course: { title: "Course" } }];
  const populations = [];
  t.mock.method(Certificate, "find", filter => {
    assert.deepEqual(filter, {});
    return { populate(...args) { populations.push(args); return this; }, sort(order) { assert.deepEqual(order, { issuedAt: -1 }); return Promise.resolve(rows); } };
  });
  let result;
  await adminCertificates({}, { json(body) { result = body; } });
  assert.deepEqual(result, { certificates: rows });
  assert.deepEqual(populations, [["user", "name email"], ["course", "title thumbnail"]]);
});

test("certificate permission permits admins and delegated users and denies others", () => {
  const check = authorizeAdminPermission("certificates");
  for (const [user, allowed] of [[{ role: "admin" }, true], [{ role: "employee", adminAccess: true, adminPermissions: ["certificates"] }, true], [{ role: "student" }, false], [{ role: "employee", adminAccess: true, adminPermissions: ["reports"] }, false]]) {
    let passed = false;
    let status;
    check({ user }, { status(value) { status = value; return this; }, json() {} }, () => { passed = true; });
    assert.equal(passed, allowed);
    if (!allowed) assert.equal(status, 403);
  }
});
