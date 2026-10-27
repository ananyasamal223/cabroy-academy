import test from "node:test";
import assert from "node:assert/strict";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import { getSubscriptionPlans, updateSubscriptionPlan } from "./subscriptionPlans.controller.js";
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; } });
test("plan listing merges saved settings with real starting prices", async t => {
 t.mock.method(SubscriptionPlan, "find", () => ({ lean: async () => [{ planId: "pro", name: "Pro Plus", monthly: 2100, yearly: 20000 }] }));
 const res = response(); await getSubscriptionPlans({}, res);
 assert.equal(res.body.plans.length, 3); assert.equal(res.body.plans[0].monthly, 999); assert.equal(res.body.plans[1].monthly, 2100); assert.equal(res.body.plans[1].name, "Pro Plus");
});
test("invalid prices are rejected", async () => {
 const res = response(); await updateSubscriptionPlan({ params: { id: "pro" }, body: { name: "Pro", description: "Test", monthly: -1, yearly: 2000 } }, res); assert.equal(res.code, 400);
});
test("missing or invalid benefits are rejected", async () => {
 const res = response(); await updateSubscriptionPlan({ params: { id: "pro" }, body: { name: "Pro", description: "Test", monthly: 1999, yearly: 15999, benefits: {} } }, res); assert.equal(res.code, 400);
});
test("valid plan edits persist prices and benefits", async t => {
 const benefits = { selected: false, all: true, community: "Full Access", certificates: true, live: true, projects: "Unlimited", mentoring: true, sessions: 4, doubts: true, paths: false, students: 1, support: "Priority" };
 let saved = false;
 t.mock.method(SubscriptionPlan, "findOneAndUpdate", async (query, value, opts) => { assert.equal(query.planId, "pro"); assert.equal(value.yearly, 15999); assert.equal(value.benefits.sessions, 4); assert.equal(opts.runValidators, true); saved = true; });
 const res = response(); await updateSubscriptionPlan({ params: { id: "pro" }, body: { name: "Pro", description: "Test", monthly: 1999, yearly: 15999, benefits } }, res); assert.equal(res.code, 200); assert.equal(saved, true);
});
