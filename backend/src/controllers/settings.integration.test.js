import { randomUUID } from "node:crypto";
const initialPassword = randomUUID();
const changedPassword = randomUUID();
import process from "node:process";
import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../utils/token.js";
import app from "../app.js";

test("Settings persistence and password security", { skip: process.env.AUTH_INTEGRATION !== "1", timeout: 120000 }, async t => {
 const dbName = "rathi_settings_test_" + Date.now();
 const oldSecret = process.env.JWT_SECRET;
 process.env.JWT_SECRET = randomUUID();
 let server;
 try {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/rathi_academy", { dbName, serverSelectionTimeoutMS: 5000 });
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const origin = "http://127.0.0.1:" + server.address().port + "/api";
  const request = async (route, method = "GET", body, token) => {
   const response = await fetch(origin + route, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
   return { status: response.status, body: await response.json() };
  };
  const password = await bcrypt.hash(initialPassword, 12);
  const user = await User.create({ name: "Real Settings Learner", email: "settings@example.test", phone: "9876543210", password, emailVerifiedAt: new Date() });
  const other = await User.create({ name: "Other Learner", email: "other@example.test", password });
  const token = signToken(user);
  await t.test("account data is real and access requires authentication", async () => {
   assert.equal((await request("/users/me/settings")).status, 401);
   const result = await request("/users/me/settings", "GET", undefined, token);
   assert.equal(result.status, 200);
   assert.deepEqual(result.body.account, { name: user.name, email: user.email, phone: user.phone, emailVerified: true });
   assert.equal(result.body.preferences.communityUpdates, false);
  });
  await t.test("preferences persist for only the signed-in account", async () => {
   const result = await request("/users/me/settings", "PATCH", { preferences: { emailNotifications: false, communityUpdates: true } }, token);
   assert.equal(result.status, 200);
   const reloaded = await request("/users/me/settings", "GET", undefined, token);
   assert.equal(reloaded.body.preferences.emailNotifications, false);
   assert.equal(reloaded.body.preferences.communityUpdates, true);
   assert.equal(reloaded.body.preferences.courseUpdates, true);
   assert.equal((await User.findById(other._id)).notificationPreferences.emailNotifications, true);
  });
  await t.test("invalid and unknown preference fields are rejected", async () => {
   for (const preferences of [{ courseUpdates: "false" }, { role: true }, { toString: true }, {}, []]) {
    assert.equal((await request("/users/me/settings", "PATCH", { preferences }, token)).status, 400);
   }
   assert.equal((await User.findById(user._id)).role, "student");
  });
  await t.test("password validation and wrong current password leave credentials intact", async () => {
   for (const body of [{ currentPassword: "wrong", newPassword: changedPassword }, { currentPassword: initialPassword, newPassword: "short" }, { currentPassword: initialPassword, newPassword: initialPassword }, { currentPassword: initialPassword, newPassword: "x".repeat(73) }]) {
    assert.equal((await request("/users/me/password", "POST", body, token)).status, 400);
   }
   assert.equal(await bcrypt.compare(initialPassword, (await User.findById(user._id).select("+password")).password), true);
  });
  await t.test("password update replaces the hash and invalidates old sessions", async () => {
   const changed = await request("/users/me/password", "POST", { currentPassword: initialPassword, newPassword: changedPassword }, token);
   assert.equal(changed.status, 200);
   assert.equal(changed.body.user.password, undefined);
   assert.equal((await request("/auth/me", "GET", undefined, token)).status, 401);
   assert.equal((await request("/auth/me", "GET", undefined, changed.body.token)).status, 200);
   assert.equal((await request("/auth/login", "POST", { identifier: user.email, password: initialPassword })).status, 401);
   assert.equal((await request("/auth/login", "POST", { identifier: user.email, password: changedPassword })).status, 200);
  });
 } finally {
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.name === dbName && /^rathi_settings_test_\d+$/.test(dbName)) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (oldSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = oldSecret;
 }
});
