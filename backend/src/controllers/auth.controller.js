import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import PendingSignup from "../models/PendingSignup.js";
import { signToken } from "../utils/token.js";
import { sendEmail } from "../utils/email.js";

const safeUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  avatar: u.avatar,
  bio: u.bio,
  isActive: u.isActive,
  emailVerified: Boolean(u.emailVerifiedAt),

  // Restricted employee/admin portal access. These fields must be returned
  // by both /auth/login and /auth/me so the frontend can send sales and
  // instructor employees to their correct personal dashboard.
  employeeId: u.employeeId || "",
  employeeRole: u.employeeRole || "",
  department: u.department || "",
  adminAccess: Boolean(u.adminAccess),
  adminPermissions: Array.isArray(u.adminPermissions) ? u.adminPermissions : [],
  salesPerson: u.salesPerson || null,
  assignedCourses: Array.isArray(u.assignedCourses) ? u.assignedCourses : [],
});

const normalizeEmail = value => typeof value === "string" ? value.trim().toLowerCase() : "";
const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const normalizePhone = value => {
  const digits = typeof value === "string" ? value.replace(/[\s()+-]/g, "") : "";
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
};
const validPassword = value => typeof value === "string" && value.length >= 6 && Buffer.byteLength(value, "utf8") <= 72;
const otpHash = value => crypto.createHash("sha256").update(value).digest("hex");

export async function signup(req, res) {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = normalizeEmail(req.body.email);
  const phone = normalizePhone(req.body.phone);
  const { password } = req.body;
  if (!name || name.length > 100 || !validEmail(email)) return res.status(400).json({ message: "Enter your name and a valid email address." });
  if (!validPassword(password)) return res.status(400).json({ message: "Password must be at least 6 characters and no more than 72 bytes." });
  if (req.body.phone && !/^[6-9]\d{9}$/.test(phone)) return res.status(400).json({ message: "Enter a valid 10-digit Indian mobile number." });
  if (req.body.acceptTerms !== true) return res.status(400).json({ message: "Please agree to the Terms of Service and Privacy Policy." });
  const conditions = [{ email }];
  if (phone) conditions.push({ phone });
  if (await User.findOne({ $or: conditions })) return res.status(409).json({ message: "Email or phone already registered." });
  const previous = await PendingSignup.findOne({ email });
  if (previous && Date.now() - previous.lastSentAt.getTime() < 60000) return res.status(429).json({ message: "Please wait 60 seconds before requesting another signup code." });
  const code = String(crypto.randomInt(100000, 1000000));
  const pending = await PendingSignup.findOneAndUpdate({ email }, { $set: { name, phone: phone || undefined, password: await bcrypt.hash(password, 12), code: otpHash(code), attempts: 0, termsAcceptedAt: new Date(), policyVersion: "draft-2026-10-08", lastSentAt: new Date(), expiresAt: new Date(Date.now() + 10 * 60 * 1000) } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  try { await sendEmail({ to: email, subject: "Verify your Rathi Academy account", html: `<p>Your signup verification code is <b>${code}</b>. It expires in 10 minutes. Your account is created only after you verify this code.</p>` }); }
  catch { await PendingSignup.deleteOne({ _id: pending._id, code: otpHash(code) }); return res.status(503).json({ message: "Verification email could not be sent. Please try again later or contact support." }); }
  return res.status(202).json({ message: "Verify your email to finish creating your account.", email, ...(process.env.NODE_ENV === "development" && !process.env.SMTP_HOST ? { devOtp: code } : {}) });
}

export async function resendSignupOtp(req, res) {
  const email = normalizeEmail(req.body.email);
  if (!validEmail(email)) return res.status(400).json({ message: "Enter a valid email address." });
  const pending = await PendingSignup.findOne({ email });
  if (!pending) return res.status(400).json({ message: "Start signup again to request a new code." });
  if (Date.now() - pending.lastSentAt.getTime() < 60000) return res.status(429).json({ message: "Please wait 60 seconds before requesting another code." });
  const code = String(crypto.randomInt(100000, 1000000));
  try { await sendEmail({ to: email, subject: "Your new Rathi Academy signup code", html: `<p>Your new signup verification code is <b>${code}</b>. It expires in 10 minutes. Only the latest code can be used.</p>` }); }
  catch { return res.status(503).json({ message: "Verification email could not be sent. Please try again later." }); }
  const updated = await PendingSignup.updateOne({ _id: pending._id, lastSentAt: pending.lastSentAt }, { $set: { code: otpHash(code), attempts: 0, lastSentAt: new Date(), expiresAt: new Date(Date.now() + 10 * 60 * 1000) } });
  if (!updated.matchedCount) return res.status(409).json({ message: "Signup changed. Please use the latest code or start again." });
  return res.json({ message: "A new verification code has been sent.", ...(process.env.NODE_ENV === "development" && !process.env.SMTP_HOST ? { devOtp: code } : {}) });
}

export async function verifySignupOtp(req, res) {
  const email = normalizeEmail(req.body.email);
  const { otp } = req.body;
  if (!validEmail(email) || typeof otp !== "string" || !/^\d{6}$/.test(otp)) return res.status(400).json({ message: "Enter the complete 6-digit signup code." });
  const pending = await PendingSignup.findOneAndUpdate({ email, expiresAt: { $gt: new Date() }, attempts: { $lt: 5 } }, { $inc: { attempts: 1 } }, { new: true }).select("+code +password");
  if (!pending || pending.code !== otpHash(otp)) return res.status(400).json({ message: "Invalid or expired code. Request a new code if needed." });
  const consumed = await PendingSignup.findOneAndDelete({ _id: pending._id, code: pending.code, expiresAt: { $gt: new Date() } }).select("+password");
  if (!consumed) return res.status(400).json({ message: "Code already used or expired. Start signup again." });
  try {
    const user = await User.create({ name: consumed.name, email, ...(consumed.phone ? { phone: consumed.phone } : {}), password: consumed.password, termsAcceptedAt: consumed.termsAcceptedAt, policyVersion: consumed.policyVersion, emailVerifiedAt: new Date() });
    return res.status(201).json({ message: "Email verified. Your account is ready to sign in.", user: safeUser(user) });
  } catch (error) { if (error.code === 11000) return res.status(409).json({ message: "Email or phone already registered. Sign in or start signup with different details." }); throw error; }
}

export async function login(req, res) {
  const identifier = typeof req.body.identifier === "string" ? req.body.identifier.trim() : "";
  const { password } = req.body;
  if (!identifier || typeof password !== "string" || !password) return res.status(400).json({ message: "Email/mobile and password are required." });
  const user = await User.findOne({ $or: [{ email: normalizeEmail(identifier) }, { phone: normalizePhone(identifier) }] }).select("+password");
  if (!user || !user.isActive || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: "Invalid email/mobile or password." });
  return res.json({ message: "Login successful", token: signToken(user), user: safeUser(user) });
}
export async function me(req, res) { res.json({ user: safeUser(req.user) }); }
export async function logout(req, res) { res.json({ message: "Logged out successfully" }); }

export async function googleAuth(req, res) {
  const { accessToken } = req.body;
  if (typeof accessToken !== "string" || !accessToken || accessToken.length > 4096) return res.status(400).json({ message: "Missing or invalid Google access token." });
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(503).json({ message: "Google sign-in is not configured on the server." });
  let profile;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/tokeninfo?" + new URLSearchParams({ access_token: accessToken }), { signal: AbortSignal.timeout(10000) });
    if (!tokenRes.ok) return res.status(401).json({ message: "Invalid Google token." });
    const token = await tokenRes.json();
    if ((token.aud || token.audience || token.issued_to) !== clientId || Number(token.expires_in) <= 0) return res.status(401).json({ message: "Google token does not belong to this application or has expired." });
    const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10000) });
    if (!googleRes.ok) return res.status(401).json({ message: "Invalid Google token." });
    profile = await googleRes.json();
  } catch { return res.status(503).json({ message: "Google sign-in is temporarily unavailable. Please try again." }); }
  if (!validEmail(profile.email) || profile.email_verified !== true || !profile.sub) return res.status(401).json({ message: "Google account has no verified email." });
  const email = normalizeEmail(profile.email);
  let user = await User.findOne({ email });
  if (!user) {
    if (req.body.acceptTerms !== true) return res.status(409).json({ message: "Create an account and accept the policies on the signup page before using Google sign-in." });
    try { user = await User.create({ name: profile.name || email.split("@")[0], email, avatar: profile.picture || "", googleId: profile.sub, emailVerifiedAt: new Date(), termsAcceptedAt: new Date(), policyVersion: "draft-2026-10-08", password: await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 12) }); }
    catch (error) { if (error.code !== 11000) throw error; user = await User.findOne({ email }); }
  }
  if (!user || !user.isActive) return res.status(401).json({ message: "This account has been disabled." });
  if (user.googleId && user.googleId !== profile.sub) return res.status(401).json({ message: "Google account does not match this account." });
  if (!user.googleId) { user.googleId = profile.sub; if (!user.avatar && profile.picture) user.avatar = profile.picture; await user.save(); }
  if (!user.emailVerifiedAt) { user.emailVerifiedAt = new Date(); await user.save(); }
  return res.json({ message: "Login successful", token: signToken(user), user: safeUser(user) });
}

export async function sendForgotOtp(req, res) {
  const email = normalizeEmail(req.body.email);
  if (!validEmail(email)) return res.status(400).json({ message: "Enter a valid email address." });
  const user = await User.findOne({ email, isActive: true });
  if (!user) return res.json({ message: "If an active account exists, a verification code will be sent." });
  const previous = await Otp.findOne({ email }).sort({ createdAt: -1 });
  if (previous && Date.now() - previous.createdAt.getTime() < 60000) return res.status(429).json({ message: "Please wait 60 seconds before requesting another code." });
  const code = String(crypto.randomInt(1000, 10000));
  const record = await Otp.create({ email, code: otpHash(code), expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
  try { await sendEmail({ to: email, subject: "Rathi Academy password reset OTP", html: `<p>Your verification code is <b>${code}</b>. It expires in 10 minutes. If you did not request a password reset, ignore this email.</p>` }); }
  catch { await Otp.deleteOne({ _id: record._id }); return res.status(503).json({ message: "Password-reset email could not be sent. Please try again later or contact support." }); }
  await Otp.deleteMany({ email, _id: { $ne: record._id } });
  return res.json({ message: "If an active account exists, a verification code will be sent.", ...(process.env.NODE_ENV === "development" && !process.env.SMTP_HOST ? { devOtp: code } : {}) });
}
export async function verifyForgotOtp(req, res) {
  const email = normalizeEmail(req.body.email);
  const { otp } = req.body;
  if (!validEmail(email) || typeof otp !== "string" || !/^\d{4}$/.test(otp)) return res.status(400).json({ message: "Enter the complete 4-digit verification code." });
  const record = await Otp.findOneAndUpdate({ email, expiresAt: { $gt: new Date() }, attempts: { $lt: 5 } }, { $inc: { attempts: 1 } }, { new: true, sort: { createdAt: -1 } });
  if (!record || record.code !== otpHash(otp)) return res.status(400).json({ message: "Invalid or expired code. Request a new code if needed." });
  record.verified = true; await record.save();
  return res.json({ message: "OTP verified" });
}
export async function resetPassword(req, res) {
  const email = normalizeEmail(req.body.email);
  const { otp, newPassword } = req.body;
  if (!validEmail(email) || typeof otp !== "string" || !/^\d{4}$/.test(otp)) return res.status(400).json({ message: "A verified code and valid email are required." });
  if (!validPassword(newPassword)) return res.status(400).json({ message: "New password must be at least 6 characters and no more than 72 bytes." });
  const user = await User.findOne({ email, isActive: true }).select("+password");
  if (!user) return res.status(400).json({ message: "OTP verification required." });
  const password = await bcrypt.hash(newPassword, 12);
  const record = await Otp.findOneAndDelete({ email, code: otpHash(otp), verified: true, attempts: { $lte: 5 }, expiresAt: { $gt: new Date() } });
  if (!record) return res.status(400).json({ message: "OTP verification required or code expired." });
  user.password = password; user.authVersion = (user.authVersion || 0) + 1; await user.save();
  await Otp.deleteMany({ email });
  return res.json({ message: "Password changed successfully" });
}
