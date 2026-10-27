import { Buffer } from "node:buffer";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { signToken } from "../utils/token.js";

export async function updateMyProfile(req, res) {
  for (const key of ["name", "phone", "avatar", "bio", "location"]) if (req.body[key] !== undefined) req.user[key] = req.body[key];
  await req.user.save();
  res.json({ message: "Profile updated", user: req.user });
}
export async function listUsers(req, res) {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users });
}
export async function getUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
}
export async function updateUser(req, res) {
  const user = await User.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
}
const preferenceDefaults = { emailNotifications: true, courseUpdates: true, assignmentReminders: true, mentorSessionReminders: true, communityUpdates: false };
const preferencesFor = user => ({ ...preferenceDefaults, ...(user.notificationPreferences?.toObject?.() || user.notificationPreferences || {}) });
export async function getMySettings(req, res) {
  res.json({ preferences: preferencesFor(req.user), account: { name: req.user.name, email: req.user.email, phone: req.user.phone || "", emailVerified: Boolean(req.user.emailVerifiedAt) } });
}
export async function updateMySettings(req, res) {
  const preferences = req.body.preferences;
  if (!preferences || typeof preferences !== "object" || Array.isArray(preferences) || !Object.keys(preferences).length || Object.entries(preferences).some(([key, value]) => !Object.hasOwn(preferenceDefaults, key) || typeof value !== "boolean")) return res.status(400).json({ message: "Provide valid notification preferences." });
  req.user.notificationPreferences = { ...preferencesFor(req.user), ...preferences };
  await req.user.save();
  res.json({ message: "Preferences saved", preferences: preferencesFor(req.user) });
}
export async function changeMyPassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (typeof currentPassword !== "string" || !currentPassword || typeof newPassword !== "string" || newPassword.length < 6 || Buffer.byteLength(newPassword, "utf8") > 72) return res.status(400).json({ message: "Enter your current password and a new password of at least 6 characters and no more than 72 bytes." });
  if (currentPassword === newPassword) return res.status(400).json({ message: "Choose a different new password." });
  const user = await User.findById(req.user._id).select("+password");
  if (!user || !user.isActive || !(await bcrypt.compare(currentPassword, user.password))) return res.status(400).json({ message: "Current password is incorrect." });
  user.password = await bcrypt.hash(newPassword, 12);
  user.authVersion = (user.authVersion || 0) + 1;
  await user.save();
  const safe = user.toObject(); delete safe.password;
  res.json({ message: "Password updated. Other sessions have been signed out.", token: signToken(user), user: { ...safe, id: user._id, emailVerified: Boolean(user.emailVerifiedAt) } });
}
