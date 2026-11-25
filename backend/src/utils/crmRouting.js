import mongoose from "mongoose";
import Contact from "../models/Contact.js";
import CrmTeam from "../models/CrmTeam.js";

const normalized = (value) => (typeof value === "string" ? value.trim().toLowerCase() : "");

function sourceKey(source) {
  const key = normalized(source);
  if (["google", "google ads"].includes(key)) return "google";
  if (["meta", "meta ads", "facebook", "facebook ads", "instagram", "instagram ads"].includes(key)) return "meta";
  return key || "website";
}

export async function createRoutedLeads(records) {
  if (records.every(({ teamId, assignedTo }) => teamId || assignedTo) || !await CrmTeam.exists({ active: true })) {
    return Contact.insertMany(records);
  }

  // Serializing intake keeps simultaneous webhook and website submissions from choosing the same team.
  const locks = mongoose.connection.collection("crm_routing");
  try {
    await locks.updateOne({ _id: "lead-intake" }, { $setOnInsert: { revision: 0 } }, { upsert: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }

  return mongoose.connection.transaction(async (session) => {
    await locks.updateOne({ _id: "lead-intake" }, { $inc: { revision: 1 } }, { session });
    const teams = await CrmTeam.find({ active: true }).sort({ _id: 1 }).session(session).lean();
    const groups = await Contact.aggregate([
      { $match: { teamId: { $in: teams.map(({ _id }) => _id) } } },
      { $group: { _id: { team: "$teamId", source: "$source" }, count: { $sum: 1 } } },
    ]).session(session);
    const workloads = new Map(teams.map((team) => [String(team._id), {
      total: 0, bySource: new Map(), last: team.lastRoutedAt?.getTime() || 0,
    }]));
    for (const { _id, count } of groups) {
      const load = workloads.get(String(_id.team));
      const key = sourceKey(_id.source);
      load.total += count;
      load.bySource.set(key, (load.bySource.get(key) || 0) + count);
    }

    const touched = new Set();
    const routed = records.map((record) => {
      if (record.teamId || record.assignedTo) return record;
      const course = normalized(record.course);
      const specialists = course ? teams.filter((team) => team.courses.some((name) => normalized(name) === course)) : [];
      const eligible = specialists.length ? specialists : teams.filter((team) => !team.courses.length);
      const byTeam = (team) => workloads.get(String(team._id));
      const key = sourceKey(record.source);
      const sourceCount = (load) => load.bySource.get(key) || 0;
      eligible.sort((left, right) => {
        const a = byTeam(left);
        const b = byTeam(right);
        return sourceCount(a) - sourceCount(b) || a.total - b.total || a.last - b.last;
      });
      const team = eligible[0];
      if (!team) return record;
      const load = byTeam(team);
      load.bySource.set(key, sourceCount(load) + 1);
      load.total += 1;
      load.last = Math.max(Date.now(), ...[...workloads.values()].map((item) => item.last + 1));
      touched.add(team);
      return { ...record, teamId: team._id };
    });

    const contacts = await Contact.insertMany(routed, { session });
    for (const team of touched) {
      await CrmTeam.updateOne({ _id: team._id }, { lastRoutedAt: new Date(workloads.get(String(team._id)).last) }, { session });
    }
    return contacts;
  });
}
