import test from "node:test";
import assert from "node:assert/strict";
import process from "node:process";
import mongoose from "mongoose";
import Course from "./Course.js";
import { prepareCourseProjects } from "../../../frontend/src/admin/courseProjectFields.js";
const project = { title: " SEO Campaign ", problemStatement: " Build a campaign. ", deliverables: [" Research ", "", "Report"], resourceLinks: ["https://example.test/template"], submissionRequirements: { projectLink: true, description: true, githubLink: false }, availability: "after_purchase", deadlineType: "relative", deadlineDays: "14", timerHours: null, reviewCriteria: " Check the report. ", requiredForCertificate: true };
test("course projects are optional and normalize for saving", () => {
 assert.deepEqual(prepareCourseProjects([]), []);
 const [saved] = prepareCourseProjects([project]);
 assert.equal(saved.title, "SEO Campaign");
 assert.deepEqual(saved.deliverables, ["Research", "Report"]);
 assert.equal(saved.deadlineDays, 14);
 assert.equal(saved.timerHours, null);
 assert.equal(saved.reviewCriteria, "Check the report.");
});
test("incomplete projects and invalid deadlines, resources, timers and modules are rejected", () => {
 for (const patch of [{ title: "" }, { problemStatement: "" }, { resourceLinks: ["javascript:alert(1)"] }, { deadlineDays: "0" }, { deadlineDays: "1.5" }, { deadlineType: "fixed", fixedDeadline: "" }, { timerHours: "0" }, { availability: "after_module", unlockModuleIndex: 2 }]) assert.throws(() => prepareCourseProjects([{ ...project, ...patch }], 1), /Project 1:/);
 const [saved] = prepareCourseProjects([{ ...project, availability: "after_module", unlockModuleIndex: 0, timerHours: "10", deadlineType: "fixed", fixedDeadline: "2030-10-09T12:00" }], 1);
 assert.equal(saved.unlockModuleIndex, 0);
 assert.equal(saved.timerHours, 10);
 assert.ok(saved.fixedDeadline.endsWith("Z"));
});
test("course project configuration persists and reloads in an isolated database", { skip: process.env.COURSE_PROJECTS_INTEGRATION !== "1", timeout: 60000 }, async () => {
 const dbName = "rathi_course_projects_test_" + Date.now();
 try {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/rathi_academy", { dbName, serverSelectionTimeoutMS: 5000 });
  const course = await Course.create({ title: "Project Configuration", slug: "project-configuration", instructor: new mongoose.Types.ObjectId(), projects: prepareCourseProjects([project]) });
  const reloaded = await Course.findById(course._id);
  assert.equal(reloaded.projects.length, 1);
  assert.equal(reloaded.projects[0].title, "SEO Campaign");
  assert.equal(reloaded.projects[0].deadlineDays, 14);
  assert.equal(reloaded.projects[0].requiredForCertificate, true);
  assert.equal(reloaded.projects[0].timerHours, null);
  const definitions = prepareCourseProjects(reloaded.toObject().projects);
  definitions[0].title = "Updated campaign";
  await Course.findByIdAndUpdate(course._id, { $set: { projects: definitions } }, { runValidators: true });
  assert.equal((await Course.findById(course._id)).projects[0].title, "Updated campaign");
  await Course.findByIdAndUpdate(course._id, { $set: { projects: [] } }, { runValidators: true });
  assert.equal((await Course.findById(course._id)).projects.length, 0);
 } finally {
  if (mongoose.connection.name === dbName && /^rathi_course_projects_test_\d+$/.test(dbName)) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
 }
});
