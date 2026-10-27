import test from "node:test";
import assert from "node:assert/strict";
import { normalizeEmail, normalizePhone, signupError } from "./authValidation.js";
const form = { name: "Learner", email: "learner@example.com", phone: "9876543210", password: "secure123", confirmPassword: "secure123" };
test("normalizes email and Indian phone formats", () => {
 assert.equal(normalizeEmail(" Learner@Example.COM "), "learner@example.com");
 assert.equal(normalizePhone("+91 98765 43210"), "9876543210");
});
test("signup requires valid details, matching passwords and explicit consent", () => {
 assert.equal(signupError(form, true), "");
 assert.match(signupError(form, false), /agree/);
 assert.match(signupError({ ...form, name: "   " }, true), /fields/);
 assert.match(signupError({ ...form, email: "invalid" }, true), /email/);
 assert.match(signupError({ ...form, phone: "123" }, true), /mobile/);
 assert.match(signupError({ ...form, confirmPassword: "different" }, true), /match/);
});
