import { isObjectIdOrHexString } from "mongoose";
import Contact, { crmStages } from "../models/Contact.js";
import Course from "../models/Course.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";

const activeSalesUsers = {
  isActive: true,
  $or: [
    { role: "admin" },
    { adminAccess: true, adminPermissions: { $in: ["sales", "sales_manage"] } },
  ],
};
const defaultPreferences = { pageSize: 10, followUpTime: "16:00", leadSource: "Manual" };
const fieldLimits = { name: 120, email: 254, phone: 50, subject: 200, message: 4000, course: 160, city: 100, source: 80 };
const listingFields = "-crmNotes -crmActivity -message -__v";
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function crmAccess(req, res, next) {
  const { role, adminAccess, adminPermissions = [] } = req.user;
  req.crmManager = role === "admin" || (adminAccess && adminPermissions.includes("sales_manage"));
  if (req.crmManager || (adminAccess && adminPermissions.includes("sales"))) return next();
  return res.status(403).json({ message: "CRM access is restricted to sales staff." });
}

function leadData(contact) {
  const legacyStage = { "Counselling Booked": "Demo booked", Closed: "Lost" }[contact.crmStage];
  const counsellingCourse = /^Counselling enquiry:\s*(.+)/i.exec(contact.subject || "")?.[1];
  return {
    ...contact,
    course: contact.course || counsellingCourse || "",
    city: contact.city || /^City:\s*(.+)$/m.exec(contact.message || "")?.[1] || "",
    source: contact.source || "Website",
    crmStage: legacyStage || contact.crmStage || ({ closed: "Lost", read: "Contacted" }[contact.status] || "New"),
  };
}

function leadScope(req) {
  return req.crmManager ? {} : { assignedTo: req.user._id };
}

function preferencesFor(user) {
  return { ...defaultPreferences, ...(user.crmPreferences?.toObject?.() || user.crmPreferences) };
}

function prepareLead(input, req) {
  if (!input || typeof input !== "object") return null;
  const values = {};
  for (const [key, max] of Object.entries(fieldLimits)) {
    const value = input[key] ?? "";
    if (typeof value !== "string" || value.trim().length > max) return null;
    values[key] = value.trim();
  }
  if (!values.name || !validEmail(values.email)) return null;
  return {
    ...values,
    email: values.email.toLowerCase(),
    source: values.source || preferencesFor(req.user).leadSource,
    message: values.message || "Added in CRM",
    assignedTo: req.crmManager ? null : req.user._id,
    crmStage: "New",
  };
}

export async function listCrmLeads(req, res) {
  const [contacts, assignees, courses] = await Promise.all([
    Contact.find(leadScope(req)).select(listingFields).sort({ createdAt: -1 }).lean(),
    req.crmManager ? User.find(activeSalesUsers).select("name").sort({ name: 1 }).lean() : [],
    Course.find().distinct("title"),
  ]);
  res.json({
    leads: contacts.map(leadData), assignees, courses, stages: crmStages, canAssign: req.crmManager,
    preferences: preferencesFor(req.user),
  });
}

export async function getCrmLead(req, res) {
  const { id } = req.params;
  if (!isObjectIdOrHexString(id)) return res.status(404).json({ message: "Lead not found." });
  const contact = await Contact.findOne({ ...leadScope(req), _id: id }).select("-__v").lean();
  if (!contact) return res.status(404).json({ message: "Lead not found." });
  res.json({ lead: leadData(contact) });
}

export async function getCrmPayments(req, res) {
  if (!req.crmManager) return res.status(403).json({ message: "Only sales managers can view payments." });
  const { id } = req.params;
  if (!isObjectIdOrHexString(id)) return res.status(404).json({ message: "Lead not found." });
  const contact = await Contact.findOne({ ...leadScope(req), _id: id }).select("email").lean();
  if (!contact) return res.status(404).json({ message: "Lead not found." });
  const student = await User.findOne({ email: contact.email.trim().toLowerCase(), role: "student" }).select("_id").lean();
  const payments = student ? await Payment.find({ user: student._id, status: "paid" })
    .select("amount currency paidAt createdAt planName courses")
    .populate("courses", "title").sort({ paidAt: -1 }).lean() : [];
  res.json({ payments });
}

export async function createCrmLead(req, res) {
  const record = prepareLead(req.body, req);
  if (!record) return res.status(400).json({ message: "Enter a name and valid email, and keep lead details within the form limits." });
  const contact = await Contact.create(record);
  res.status(201).json({ lead: leadData(contact.toObject()) });
}

export async function importCrmLeads(req, res) {
  if (!req.crmManager) return res.status(403).json({ message: "Only sales managers can import leads." });
  const { rows } = req.body;
  if (!Array.isArray(rows) || !rows.length || rows.length > 200) {
    return res.status(400).json({ message: "Import between 1 and 200 leads at a time." });
  }
  const records = rows.map((row) => prepareLead(row, req));
  const invalid = records.indexOf(null);
  if (invalid !== -1) return res.status(400).json({ message: `CSV row ${invalid + 2} needs a valid name, email, and field lengths.` });
  const contacts = await Contact.insertMany(records);
  res.status(201).json({ leads: contacts.map((contact) => leadData(contact.toObject())) });
}

export async function updateCrmPreferences(req, res) {
  const { pageSize, followUpTime, leadSource } = req.body;
  if (![10, 25, 50].includes(pageSize) || typeof followUpTime !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(followUpTime)
    || typeof leadSource !== "string" || !leadSource.trim() || leadSource.trim().length > 80) {
    return res.status(400).json({ message: "Enter valid CRM preferences." });
  }
  const preferences = { pageSize, followUpTime, leadSource: leadSource.trim() };
  await User.updateOne({ _id: req.user._id }, { $set: { crmPreferences: preferences } }, { runValidators: true });
  res.json({ preferences });
}

function parseScheduledTime(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return null;
  const time = new Date(value);
  return time.toJSON() === value ? time : null;
}

export async function updateCrmLead(req, res) {
  const { id } = req.params;
  if (!isObjectIdOrHexString(id)) return res.status(404).json({ message: "Lead not found." });
  const { crmStage, assignedTo, followUpAt, demoAt, note, call, details } = req.body;
  const scope = { ...leadScope(req), _id: id };
  const fields = {};
  const activity = [];
  const log = (kind, text) => activity.push({ kind, text, author: req.user.name });
  if (crmStage !== undefined) {
    if (!crmStages.includes(crmStage)) return res.status(400).json({ message: "Choose a valid pipeline stage." });
    fields.crmStage = crmStage;
    if (crmStage === "Enrolled") fields.enrolledAt = new Date();
    log("stage", `Stage set to ${crmStage}`);
  }
  if (assignedTo !== undefined) {
    if (!req.crmManager) return res.status(403).json({ message: "Only sales managers can assign leads." });
    if (assignedTo !== null && !isObjectIdOrHexString(assignedTo)) return res.status(400).json({ message: "Choose an active counselor." });
    const assignee = assignedTo === null ? null : await User.findOne({ ...activeSalesUsers, _id: assignedTo }).select("name").lean();
    if (assignedTo !== null && !assignee) return res.status(400).json({ message: "Choose an active counselor." });
    fields.assignedTo = assignedTo;
    log("assignment", assignee ? `Assigned to ${assignee.name}` : "Counselor unassigned");
  }
  if (followUpAt !== undefined) {
    const time = parseScheduledTime(followUpAt);
    if (followUpAt !== null && !time) return res.status(400).json({ message: "Choose a valid follow-up date and time." });
    if (followUpAt === null && (typeof req.body.completeFollowUp !== "boolean" || !req.body.completeFollowUp)) {
      return res.status(400).json({ message: "Confirm completion to clear the follow-up." });
    }
    const expected = req.body.expectedFollowUp;
    if (followUpAt === null && expected !== undefined) {
      const scheduled = parseScheduledTime(expected);
      if (scheduled) scope.followUpAt = scheduled;
      else if (typeof expected === "string" && /^\d{4}-\d{2}-\d{2}$/.test(expected)) {
        scope.followUpAt = null;
        scope.followUpOn = expected;
      } else return res.status(400).json({ message: "Choose a scheduled follow-up to complete." });
    }
    fields.followUpAt = time;
    fields.followUpOn = "";
    log("follow-up", time ? `Follow-up scheduled for ${time.toISOString()}` : "Follow-up completed");
  }
  if (demoAt !== undefined) {
    const time = parseScheduledTime(demoAt);
    if (!time || crmStage !== "Demo booked") return res.status(400).json({ message: "Choose a valid demo date and time." });
    fields.demoAt = time;
    log("demo", `Demo booked for ${time.toISOString()}`);
  }
  if (details !== undefined) {
    const record = prepareLead(details, req);
    if (!record) return res.status(400).json({ message: "Enter valid lead details." });
    for (const key of Object.keys(fieldLimits)) fields[key] = record[key];
  }
  for (const [kind, value] of [["note", note], ["call", call]]) {
    if (value === undefined) continue;
    if (typeof value !== "string" || !value.trim() || value.length > 2000) {
      return res.status(400).json({ message: "Enter text of up to 2,000 characters." });
    }
    log(kind, value.trim());
  }
  const update = {};
  if (Object.keys(fields).length) update.$set = fields;
  if (activity.length) update.$push = { crmActivity: { $each: activity } };
  if (!Object.keys(update).length) return res.status(400).json({ message: "Choose a change to save." });
  const contact = await Contact.findOneAndUpdate(scope, update, { new: true, runValidators: true }).select("-__v").lean();
  if (!contact) {
    if (req.body.expectedFollowUp !== undefined && await Contact.exists({ ...leadScope(req), _id: id })) {
      return res.status(409).json({ message: "This follow-up changed. Refresh the page and try again." });
    }
    return res.status(404).json({ message: "Lead not found." });
  }
  res.json({ lead: leadData(contact) });
}
