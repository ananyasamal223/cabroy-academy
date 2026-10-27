import test from "node:test";
import assert from "node:assert/strict";
import { postAuthDestination } from "./authRedirect.js";

const student = { role: "student" };

test("home-page student login opens the dashboard", () => {
  assert.equal(postAuthDestination(student), "/dashboard");
  assert.equal(postAuthDestination(student, undefined, ""), "/dashboard");
});

test("explicit checkout and protected-page destinations are preserved", () => {
  assert.equal(postAuthDestination(student, undefined, "?plan=pro&billing=yearly"), "/plans/pro/checkout?billing=yearly");
  assert.equal(postAuthDestination(student, { pathname: "/my-courses", search: "?tab=active", hash: "#courses" }), "/my-courses?tab=active#courses");
});

test("invalid or recursive destinations fall back to the student dashboard", () => {
  for (const from of ["/login", "/signup", "https://example.com", "//example.com"]) {
    assert.equal(postAuthDestination(student, from), "/dashboard");
  }
});

test("admin and staff routing remains unchanged", () => {
  assert.equal(postAuthDestination({ role: "admin" }), "/admin");
  assert.equal(postAuthDestination({ adminAccess: true, adminPermissions: ["sales"] }), "/admin/sales");
  assert.equal(postAuthDestination({ adminAccess: true, adminPermissions: ["instructor_portal"] }), "/admin/instructor-dashboard");
});