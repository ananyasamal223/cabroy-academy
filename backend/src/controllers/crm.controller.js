import { isObjectIdOrHexString } from "mongoose";
import Contact, { crmStages } from "../models/Contact.js";
import Course from "../models/Course.js";
import CrmTeam from "../models/CrmTeam.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import { createRoutedLeads } from "../utils/crmRouting.js";

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
  req.crmAdmin = role === "admin";
  req.crmManager = req.crmAdmin || (adminAccess && adminPermissions.includes("sales_manage"));
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
    latestDiscussion: contact.latestDiscussion
      || contact.crmActivity?.findLast(({ kind }) => kind === "note" || kind === "call")
      || contact.crmNotes?.at(-1)
      || null,
    crmStage: legacyStage || contact.crmStage || ({ closed: "Lost", read: "Contacted" }[contact.status] || "New"),
  };
}

function leadScope(req) {
  if (req.crmAdmin) return {};
  const teamId = req.user.crmTeamId || null;
  if (req.crmManager && teamId) return { teamId };
  return { teamId, assignedTo: req.user._id };
}

function counselorScope(req) {
  return req.crmAdmin ? activeSalesUsers : { ...activeSalesUsers, crmTeamId: req.user.crmTeamId };
}

function canAssign(req) {
  return req.crmAdmin || Boolean(req.crmManager && req.user.crmTeamId);
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
  if (!values.name || (values.email ? !validEmail(values.email) : !values.phone)) return null;
  return {
    ...values,
    email: values.email.toLowerCase(),
    source: values.source || preferencesFor(req.user).leadSource,
    message: values.message || "Added in CRM",
    assignedTo: canAssign(req) ? null : req.user._id,
    teamId: req.crmAdmin ? null : req.user.crmTeamId || null,
    crmStage: "New",
  };
}

export async function listCrmLeads(req, res) {
  const [contacts, assignees, courses, teams] = await Promise.all([
    Contact.aggregate([
      { $match: leadScope(req) },
      { $sort: { createdAt: -1 } },
      { $set: { latestDiscussion: { $ifNull: [
        { $arrayElemAt: [{ $filter: {
          input: { $ifNull: ["$crmActivity", []] },
          as: "entry",
          cond: { $in: ["$$entry.kind", ["note", "call"]] },
        } }, -1] },
        { $arrayElemAt: [{ $ifNull: ["$crmNotes", []] }, -1] },
      ] } } },
      { $project: Object.fromEntries(listingFields.split(" ").map((field) => [field.slice(1), 0])) },
    ]),
    canAssign(req) ? User.find(counselorScope(req)).select("name crmTeamId adminPermissions role").sort({ name: 1 }).lean() : [],
    Course.find().distinct("title"),
    CrmTeam.find(req.crmAdmin ? {} : { _id: req.user.crmTeamId || null }).select("name courses active").sort({ name: 1 }).lean(),
  ]);
  res.json({
    leads: contacts.map(leadData), assignees, courses, teams, stages: crmStages, canAssign: canAssign(req),
    canManageTeams: req.crmAdmin, canViewPayments: req.crmAdmin,
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
  if (!req.crmAdmin) return res.status(403).json({ message: "Only admins can view account payment history." });
  const { id } = req.params;
  if (!isObjectIdOrHexString(id)) return res.status(404).json({ message: "Lead not found." });
  const contact = await Contact.findOne({ ...leadScope(req), _id: id }).select("email").lean();
  if (!contact) return res.status(404).json({ message: "Lead not found." });
  const email = contact.email?.trim().toLowerCase();
  const student = email ? await User.findOne({ email, role: "student" }).select("_id").lean() : null;
  const payments = student ? await Payment.find({ user: student._id, status: "paid" })
    .select("amount currency paidAt createdAt planName courses")
    .populate("courses", "title").sort({ paidAt: -1 }).lean() : [];
  res.json({ payments });
}

export async function createCrmLead(req, res) {
  const record = prepareLead(req.body, req);
  if (!record) return res.status(400).json({ message: "Enter a name and an email or phone number, within the form limits." });
  const [contact] = await createRoutedLeads([record]);
  res.status(201).json({ lead: leadData(contact.toObject()) });
}

export async function importCrmLeads(req, res) {
  if (!canAssign(req)) return res.status(403).json({ message: "Only admins and managers assigned to a team can import leads." });
  const { rows } = req.body;
  if (!Array.isArray(rows) || !rows.length || rows.length > 200) {
    return res.status(400).json({ message: "Import between 1 and 200 leads at a time." });
  }
  const records = rows.map((row) => prepareLead(row, req));
  const invalid = records.indexOf(null);
  if (invalid !== -1) return res.status(400).json({ message: `CSV row ${invalid + 2} needs a name and an email or phone number, within the field limits.` });
  const contacts = await createRoutedLeads(records);
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

export async function saveCrmTeam(req, res) {
  const { id } = req.params;
  const { name, courses, active } = req.body;
  if (typeof name !== "string" || !name.trim() || name.trim().length > 80
    || !Array.isArray(courses) || courses.length > 100
    || courses.some((course) => typeof course !== "string" || !course.trim() || course.trim().length > 160)
    || typeof active !== "boolean") return res.status(400).json({ message: "Enter a valid team name and courses." });
  const values = { name: name.trim(), courses: [...new Set(courses.map((course) => course.trim()))], active };
  if (id && !isObjectIdOrHexString(id)) return res.status(404).json({ message: "Team not found." });
  const team = id ? await CrmTeam.findByIdAndUpdate(id, values, { new: true, runValidators: true }) : await CrmTeam.create(values);
  if (!team) return res.status(404).json({ message: "Team not found." });
  res.status(id ? 200 : 201).json({ team });
}

export async function setCrmTeamMember(req, res) {
  const { teamId } = req.body;
  if (!isObjectIdOrHexString(req.params.userId)
    || (teamId !== null && (!isObjectIdOrHexString(teamId) || !await CrmTeam.exists({ _id: teamId })))) {
    return res.status(400).json({ message: "Choose a valid counselor and team." });
  }
  const member = await User.findOneAndUpdate({ ...activeSalesUsers, _id: req.params.userId, role: { $ne: "admin" } },
    { $set: { crmTeamId: teamId } }, { new: true }).select("name crmTeamId adminPermissions role").lean();
  if (!member) return res.status(404).json({ message: "Active sales team member not found." });
  res.json({ member });
}

function parseScheduledTime(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return null;
  const time = new Date(value);
  return time.toJSON() === value ? time : null;
}

export async function updateCrmLead(req, res) {
  const { id } = req.params;
  if (!isObjectIdOrHexString(id)) return res.status(404).json({ message: "Lead not found." });
  const { crmStage, assignedTo, teamId, followUpAt, demoAt, note, call, details } = req.body;
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
  if (teamId !== undefined) {
    if (!req.crmAdmin) return res.status(403).json({ message: "Only admins can move leads between teams." });
    if (teamId !== null && !isObjectIdOrHexString(teamId)) return res.status(400).json({ message: "Choose a valid team." });
    const team = teamId && await CrmTeam.findById(teamId).select("name").lean();
    if (teamId && !team) return res.status(400).json({ message: "Choose a valid team." });
    fields.teamId = teamId;
    fields.assignedTo = null;
    log("assignment", team ? `Moved to team ${team.name}; counselor cleared` : "Moved to unassigned inbox; counselor cleared");
  }
  if (assignedTo !== undefined) {
    if (!canAssign(req)) return res.status(403).json({ message: "Only admins and team managers can assign leads." });
    if (assignedTo !== null && !isObjectIdOrHexString(assignedTo)) return res.status(400).json({ message: "Choose an active counselor." });
    const assignee = assignedTo === null ? null : await User.findOne({ ...counselorScope(req), _id: assignedTo }).select("name crmTeamId").lean();
    if (assignedTo !== null && !assignee) return res.status(400).json({ message: "Choose an active counselor." });
    if (assignee && req.crmAdmin) {
      const contact = await Contact.findById(id).select("teamId").lean();
      if (!contact) return res.status(404).json({ message: "Lead not found." });
      scope.teamId = contact.teamId || null;
      const targetTeam = teamId === undefined ? contact.teamId : teamId;
      if ((targetTeam || teamId === null) && String(targetTeam || "") !== String(assignee.crmTeamId || "")) {
        return res.status(400).json({ message: "Choose a counselor on the lead’s team, or move the lead to another team first." });
      }
      if (!targetTeam && assignee.crmTeamId) fields.teamId = assignee.crmTeamId;
    }
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
