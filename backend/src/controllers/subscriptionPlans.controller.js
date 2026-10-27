import SubscriptionPlan from "../models/SubscriptionPlan.js";
import { paymentPlans } from "../config/plans.js";
const defaults = {
 starter: { description: "Great for individual learners starting their journey.", benefits: { selected: true, all: false, community: "Basic Access", certificates: true, live: false, projects: "Limited", mentoring: false, sessions: 0, doubts: false, paths: false, students: 1, support: "Standard" } },
 pro: { description: "Best for serious learners who want complete access.", benefits: { selected: false, all: true, community: "Full Access", certificates: true, live: true, projects: "Unlimited", mentoring: true, sessions: 4, doubts: true, paths: false, students: 1, support: "Priority" } },
 business: { description: "Perfect for teams and organizations.", benefits: { selected: false, all: true, community: "Full Access", certificates: true, live: true, projects: "Unlimited", mentoring: true, sessions: 12, doubts: true, paths: true, students: 10, support: "Dedicated" } },
};
export async function getSubscriptionPlans(req, res) {
 const saved = await SubscriptionPlan.find().lean();
 res.json({ plans: Object.entries(paymentPlans).map(([id, p]) => ({ id, name: p.name, monthly: p.monthly, yearly: p.monthly * 12, ...defaults[id], ...saved.find(s => s.planId === id), id })) });
}
export async function updateSubscriptionPlan(req, res) {
 const { name, description, monthly, yearly, benefits } = req.body;
 if (!Object.hasOwn(paymentPlans, req.params.id) || typeof name !== "string" || !name.trim() || name.length > 60 || typeof description !== "string" || description.length > 120 || !Number.isFinite(monthly) || monthly < 0 || !Number.isFinite(yearly) || yearly < 0) return res.status(400).json({ message: "Enter valid plan information and prices" });
 const clean = {};
 for (const [key, sample] of Object.entries(defaults[req.params.id].benefits)) {
  const value = benefits?.[key];
  if (typeof value !== typeof sample || (typeof value === "number" && (!Number.isInteger(value) || value < 0 || value > 10000)) || (typeof value === "string" && value.length > 60)) return res.status(400).json({ message: "Invalid plan benefits" });
  clean[key] = value;
 }
 await SubscriptionPlan.findOneAndUpdate({ planId: req.params.id }, { name: name.trim(), description, monthly, yearly, benefits: clean }, { upsert: true, runValidators: true });
 res.json({ message: "Plan saved" });
}
