import { randomUUID } from "node:crypto";
const initialPassword = randomUUID();
const changedPassword = randomUUID();
const anotherPassword = randomUUID();
import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import PendingSignup from "../models/PendingSignup.js";
import app from "../app.js";
const liveFetch = globalThis.fetch;

test("authentication flows against an isolated MongoDB database", { skip: process.env.AUTH_INTEGRATION !== "1", timeout: 120000 }, async t => {
 const dbName = "rathi_auth_test_" + Date.now();
 await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/rathi_academy", { dbName, serverSelectionTimeoutMS: 5000 });
 const server = app.listen(0, "127.0.0.1");
 await new Promise(resolve => server.once("listening", resolve));
 const origin = "http://127.0.0.1:" + server.address().port + "/api";
 const savedEnv = { NODE_ENV: process.env.NODE_ENV, SMTP_HOST: process.env.SMTP_HOST, GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID, JWT_SECRET: process.env.JWT_SECRET };
 process.env.JWT_SECRET = randomUUID();
 process.env.SMTP_HOST = "test.invalid";
 process.env.NODE_ENV = "test";
 process.env.GOOGLE_CLIENT_ID = "test-client-id";
 const messages = [];
 t.mock.method(nodemailer, "createTransport", () => ({ sendMail: async message => { messages.push(message); return { accepted: [message.to] }; } }));
 const request = async (route, body, token) => {
  const response = await liveFetch(origin + route, { method: body ? "POST" : "GET", headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, body: await response.json() };
 };
 const account = { name: "Test Learner", email: "learner@example.test", phone: "9876543210", password: initialPassword, acceptTerms: true };
 try {
  await t.test("signup validates input, normalizes details and rejects duplicates", async () => {
   assert.equal((await request("/auth/signup", { ...account, email: "invalid" })).status, 400);
   assert.equal((await request("/auth/signup", { ...account, acceptTerms: false })).status, 400);
   const created = await request("/auth/signup", { ...account, email: " Learner@Example.Test ", phone: "+91 98765 43210" });
   assert.equal(created.status, 202); assert.equal(created.body.email, account.email);
   assert.equal(await User.countDocuments({ email: account.email }), 0);
   assert.equal((await request("/auth/login", { identifier: account.email, password: account.password })).status, 401);
   const signupCode = messages.at(-1).html.match(/<b>(\d{6})<\/b>/)[1];
   const pending = await PendingSignup.findOne({ email: account.email }).select("+code +password");
   assert.notEqual(pending.code, signupCode); assert.notEqual(pending.password, account.password);
   assert.equal((await request("/auth/signup/verify-otp", { email: account.email, otp: "000000" })).status, 400);
   const verified = await request("/auth/signup/verify-otp", { email: account.email, otp: signupCode });
   assert.equal(verified.status, 201); assert.equal(verified.body.user.emailVerified, true); assert.equal(verified.body.user.password, undefined);
   assert.equal((await request("/auth/signup/verify-otp", { email: account.email, otp: signupCode })).status, 400);
   assert.equal((await request("/auth/signup", account)).status, 409);
  });
  await t.test("signup codes expire, resend is throttled, and five wrong guesses lock verification", async () => {
   const email = "pending@example.test";
   assert.equal((await request("/auth/signup", { ...account, email, phone: "9876543211" })).status, 202);
   assert.equal((await request("/auth/signup/resend-otp", { email })).status, 429);
   const oldCode = messages.at(-1).html.match(/<b>(\d{6})<\/b>/)[1];
   await PendingSignup.collection.updateOne({ email }, { $set: { expiresAt: new Date(Date.now()-1000), lastSentAt: new Date(Date.now()-61000) } });
   assert.equal((await request("/auth/signup/verify-otp", { email, otp: oldCode })).status, 400);
   assert.equal((await request("/auth/signup/resend-otp", { email })).status, 200);
   const code = messages.at(-1).html.match(/<b>(\d{6})<\/b>/)[1];
   for(let i=0;i<5;i++)assert.equal((await request("/auth/signup/verify-otp", { email, otp: "000000" })).status, 400);
   assert.equal((await request("/auth/signup/verify-otp", { email, otp: code })).status, 400);
   assert.equal(await User.countDocuments({ email }), 0);
  });
  await t.test("email/mobile login and authenticated session retrieval", async () => {
   const signedIn = await request("/auth/login", { identifier: " Learner@Example.Test ", password: account.password });
   assert.equal(signedIn.status, 200); assert.equal((await request("/auth/me", null, signedIn.body.token)).status, 200);
   assert.equal((await request("/auth/login", { identifier: "+91 98765 43210", password: account.password })).status, 200);
   assert.equal((await request("/auth/login", { identifier: account.email, password: "wrong" })).status, 401);
   assert.equal((await request("/auth/login", { identifier: {}, password: [] })).status, 400);
  });
  let otp;
  const preResetToken = (await request("/auth/login", { identifier: account.email, password: account.password })).body.token;
  await t.test("OTP delivery, cooldown, verification, reset and one-time use", async () => {
   const sent = await request("/auth/forgot-password/send-otp", { email: " Learner@Example.Test " });
   assert.equal(sent.status, 200); assert.equal(sent.body.devOtp, undefined);
   otp = messages.at(-1).html.match(/<b>(\d{4})<\/b>/)[1];
   assert.notEqual((await Otp.findOne({ email: account.email })).code, otp);
   assert.equal((await request("/auth/forgot-password/send-otp", { email: account.email })).status, 429);
   assert.equal((await request("/auth/forgot-password/reset", { email: account.email, otp, newPassword: changedPassword })).status, 400);
   assert.equal((await request("/auth/forgot-password/verify-otp", { email: account.email, otp: "0000" })).status, 400);
   assert.equal((await request("/auth/forgot-password/verify-otp", { email: account.email, otp })).status, 200);
   assert.equal((await request("/auth/forgot-password/reset", { email: account.email, otp, newPassword: changedPassword })).status, 200);
   assert.equal((await request("/auth/me", null, preResetToken)).status, 401);
   const newLogin = await request("/auth/login", { identifier: account.email, password: changedPassword });
   assert.equal(newLogin.status, 200);
   assert.equal((await request("/auth/me", null, newLogin.body.token)).status, 200);
   assert.equal((await request("/auth/login", { identifier: account.email, password: account.password })).status, 401);
   assert.equal((await request("/auth/forgot-password/reset", { email: account.email, otp, newPassword: anotherPassword })).status, 400);
  });
  await t.test("expired OTP is rejected", async () => {
   await request("/auth/forgot-password/send-otp", { email: account.email });
   const code = messages.at(-1).html.match(/<b>(\d{4})<\/b>/)[1];
   await Otp.updateMany({ email: account.email }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
   assert.equal((await request("/auth/forgot-password/verify-otp", { email: account.email, otp: code })).status, 400);
   await Otp.deleteMany({ email: account.email });
  });
  await t.test("resend replaces the code and five incorrect attempts lock verification", async () => {
   await request("/auth/forgot-password/send-otp", { email: account.email });
   const originalId = (await Otp.findOne({ email: account.email }))._id;
   await Otp.collection.updateOne({ _id: originalId }, { $set: { createdAt: new Date(Date.now() - 61000) } });
   assert.equal((await request("/auth/forgot-password/send-otp", { email: account.email })).status, 200);
   const correct = messages.at(-1).html.match(/<b>(\d{4})<\/b>/)[1];
   assert.equal(await Otp.countDocuments({ email: account.email }), 1);
   assert.equal(await Otp.findById(originalId), null);
   for(let i=0;i<5;i++) assert.equal((await request("/auth/forgot-password/verify-otp", { email: account.email, otp: "0000" })).status, 400);
   assert.equal((await request("/auth/forgot-password/verify-otp", { email: account.email, otp: correct })).status, 400);
   await Otp.deleteMany({ email: account.email });
  });
  await t.test("email delivery failure does not leave a usable reset code", async () => {
   await Otp.deleteMany({ email: account.email });
   t.mock.method(nodemailer, "createTransport", () => ({ sendMail: async () => { throw new Error("SMTP unavailable"); } }));
   assert.equal((await request("/auth/forgot-password/send-otp", { email: account.email })).status, 503);
   assert.equal(await Otp.countDocuments({ email: account.email }), 0);
  });
  await t.test("Google rejects other applications and permits verified signup/sign-in", async () => {
   const profile = { email: "google@example.test", email_verified: true, sub: "google-subject", name: "Google Learner" };
   globalThis.fetch = async url => new Response(JSON.stringify(String(url).includes("tokeninfo") ? { aud: "wrong-client", expires_in: 3600 } : profile), { status: 200 });
   assert.equal((await request("/auth/google", { accessToken: "test-token", acceptTerms: true })).status, 401);
   globalThis.fetch = async url => new Response(JSON.stringify(String(url).includes("tokeninfo") ? { aud: "test-client-id", expires_in: 3600 } : profile), { status: 200 });
   assert.equal((await request("/auth/google", { accessToken: "test-token" })).status, 409);
   assert.equal((await request("/auth/google", { accessToken: "test-token", acceptTerms: true })).status, 200);
   assert.equal((await request("/auth/google", { accessToken: "test-token" })).status, 200);
   await User.updateOne({ email: profile.email }, { $set: { isActive: false } });
   assert.equal((await request("/auth/google", { accessToken: "test-token" })).status, 401);
   globalThis.fetch = liveFetch;
  });
 } finally {
  globalThis.fetch = liveFetch;
  await new Promise(resolve => server.close(resolve));
  if(mongoose.connection.name === dbName && dbName.startsWith("rathi_auth_test_")) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  for(const [key, value] of Object.entries(savedEnv)) { if(value === undefined) delete process.env[key]; else process.env[key] = value; }
 }
});
