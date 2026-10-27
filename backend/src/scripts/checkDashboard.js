// Read-only integration check against the configured database and local API.
// Run from backend: node src/scripts/checkDashboard.js
import "dotenv/config";
import process from "node:process";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
const base = `http://127.0.0.1:${Number(process.env.PORT || 5000)}/api`;
try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const admin = await User.findOne({ role: "admin", isActive: true }).select("_id").lean();
  assert.ok(admin, "An active admin account is required for this read-only check");
  const token = jwt.sign({ id: String(admin._id) }, process.env.JWT_SECRET, { expiresIn: "1m" });
  const anonymous = await fetch(`${base}/admin/overview`);
  assert.equal(anonymous.status, 401);
  const response = await fetch(`${base}/admin/overview`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(response.status, 200, "Dashboard endpoint must return 200");
  const body = await response.json();
  const instructorsResponse = await fetch(`${base}/admin/instructor-management`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(instructorsResponse.status, 200);
  const management = await instructorsResponse.json();
  assert.ok(Array.isArray(management.instructors) && Array.isArray(management.subscriptions));
  assert.equal((await fetch(`${base}/admin/instructor-management`)).status, 401);
  console.log(`PASS: instructor management loads ${management.instructors.length} instructors and ${management.subscriptions.length} subscription mentorship records; anonymous access denied.`);
  const revenueResponse = await fetch(`${base}/admin/revenue-overview`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(revenueResponse.status, 200);
  const revenue = await revenueResponse.json();
  assert.equal(revenue.stats.totalRevenue, body.stats.totalRevenue);
  assert.equal(revenue.stats.totalRevenue, revenue.stats.courseRevenue + revenue.stats.subscriptionRevenue);
  assert.equal((await fetch(`${base}/admin/revenue-overview`)).status, 401);
  console.log("PASS: revenue totals match dashboard payments, course/plan split reconciles, anonymous access denied.");
  assert.ok(body.stats && body.summary && Array.isArray(body.subscriptions));
  assert.equal(body.series.length, 6);
  const invalid = await fetch(`${base}/admin/overview?from=2026-02-30`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(invalid.status, 400);
  const reportsAnonymous = await fetch(`${base}/admin/user-reports`);
  assert.equal(reportsAnonymous.status, 401);
  const reportsResponse = await fetch(`${base}/admin/user-reports`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(reportsResponse.status, 200, "User reports endpoint must return 200");
  const reports = await reportsResponse.json();
  assert.equal(reports.rows.length, reports.stats.students);
  assert.ok(Array.isArray(reports.mentors));
  const reportedPlans = reports.rows.flatMap(row => row.subscriptions);
  assert.equal(reportedPlans.length, body.totalSubscriptions, "User reports must include every paid plan purchase shown on the dashboard");
  console.log(`PASS: all ${reportedPlans.length} dashboard plan purchases are present in User Reports.`);
  assert.ok(reports.rows.every(row => Array.isArray(row.courses) && Array.isArray(row.subscriptions) && Array.isArray(row.enrollments)));
  console.log(`PASS: user reports returns ${reports.rows.length} student records with courses, subscriptions and mentor assignments; anonymous access denied.`);
  console.log("PASS: authenticated dashboard reads configured MongoDB, anonymous access denied, invalid filters rejected.");
  console.log(`Returned ${body.subscriptions.length} subscriptions and ${body.recentStudents.length} recent enrollments.`);
} catch (error) {
  console.error("Dashboard integration check failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
