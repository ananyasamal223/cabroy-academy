import { createHmac, timingSafeEqual } from "node:crypto";
import { Router, raw } from "express";
import Contact from "../models/Contact.js";
import { createRoutedLeads } from "../utils/crmRouting.js";

const router = Router();
const isId = (value) => typeof value === "string" && /^\d{1,30}$/.test(value);

function safeEqual(value, expected) {
  if (typeof value !== "string") return false;
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function settings() {
  const { META_WEBHOOK_VERIFY_TOKEN: verifyToken, META_APP_SECRET: appSecret,
    META_PAGE_ACCESS_TOKEN: accessToken, META_PAGE_ID: pageId, META_GRAPH_API_VERSION: version } = process.env;
  if (!verifyToken || !appSecret || !accessToken || !isId(pageId) || !/^v\d+\.\d+$/.test(version || "")) return null;
  return { verifyToken, appSecret, accessToken, pageId, version, courseField: process.env.META_LEAD_COURSE_FIELD?.trim().toLowerCase() };
}

router.get("/", (req, res) => {
  const config = settings();
  if (!config) return res.sendStatus(503);
  const { "hub.mode": mode, "hub.challenge": challenge, "hub.verify_token": token } = req.query;
  if (mode !== "subscribe" || !isId(challenge) || !safeEqual(token, config.verifyToken)) return res.sendStatus(403);
  return res.type("text/plain").send(challenge);
});

function leadEvents(payload, pageId) {
  const events = new Map();
  if (payload?.object !== "page" || !Array.isArray(payload.entry)) return events;
  for (const entry of payload.entry) {
    if (entry?.id !== pageId || !Array.isArray(entry.changes)) continue;
    for (const change of entry.changes) {
      const event = change?.value;
      if (change?.field === "leadgen" && event?.page_id === pageId && isId(event.leadgen_id) && isId(event.form_id)) {
        events.set(event.leadgen_id, event);
      }
    }
  }
  return events;
}

function leadRecord(lead, event, courseField) {
  const fields = new Map();
  for (const field of Array.isArray(lead.field_data) ? lead.field_data : []) {
    if (typeof field?.name !== "string" || !Array.isArray(field.values)) continue;
    const value = field.values.find((item) => typeof item === "string" && item.trim());
    if (value) fields.set(field.name.toLowerCase(), value.trim());
  }
  const name = fields.get("full_name") || [fields.get("first_name"), fields.get("last_name")].filter(Boolean).join(" ");
  const submittedAt = new Date(lead.created_time);
  return {
    name: name.slice(0, 120) || "Meta lead",
    email: (fields.get("email") || "").slice(0, 254).toLowerCase(),
    phone: (fields.get("phone_number") || fields.get("phone") || "").slice(0, 50),
    city: (fields.get("city") || "").slice(0, 100),
    course: (fields.get(courseField) || fields.get("course") || fields.get("course_of_interest") || "").slice(0, 160),
    subject: "Meta Instant Form",
    message: "Submitted through a Meta Instant Form.",
    source: "Meta Ads",
    crmStage: "New",
    meta: {
      leadId: event.leadgen_id,
      pageId: event.page_id,
      formId: event.form_id,
      adId: isId(lead.ad_id) ? lead.ad_id : isId(event.ad_id) ? event.ad_id : undefined,
      campaignId: isId(lead.campaign_id) ? lead.campaign_id : undefined,
      platform: ["fb", "ig", "facebook", "instagram"].includes(lead.platform) ? lead.platform : undefined,
      submittedAt: lead.created_time && Number.isFinite(submittedAt.getTime()) ? submittedAt : undefined,
    },
  };
}

async function ingestLead(event, config, signal) {
  const match = { "meta.leadId": event.leadgen_id };
  if (await Contact.exists(match)) return;
  const url = new URL(`https://graph.facebook.com/${config.version}/${event.leadgen_id}`);
  url.searchParams.set("fields", "id,created_time,form_id,ad_id,campaign_id,platform,field_data");
  url.searchParams.set("appsecret_proof", createHmac("sha256", config.appSecret).update(config.accessToken).digest("hex"));
  const result = await fetch(url, { headers: { Authorization: `Bearer ${config.accessToken}` }, redirect: "error", signal });
  if (!result.ok) throw new Error("Meta lead fetch failed.");
  const lead = await result.json();
  if (lead.id !== event.leadgen_id || (lead.form_id && lead.form_id !== event.form_id)) throw new Error("Unexpected Meta lead identifiers.");
  try {
    await createRoutedLeads([leadRecord(lead, event, config.courseField)]);
  } catch (error) {
    if (error.code !== 11000 || !await Contact.exists(match)) throw error;
  }
}

router.post("/", raw({ type: "application/json", limit: "1mb", inflate: false }), async (req, res) => {
  const config = settings();
  if (!config) return res.sendStatus(503);
  if (!Buffer.isBuffer(req.body)) return res.sendStatus(415);
  const signature = `sha256=${createHmac("sha256", config.appSecret).update(req.body).digest("hex")}`;
  if (!safeEqual(req.get("x-hub-signature-256"), signature)) return res.sendStatus(403);
  let payload;
  try { payload = JSON.parse(req.body.toString("utf8")); }
  catch { return res.sendStatus(400); }
  const events = [...leadEvents(payload, config.pageId).values()];
  if (!events.length) return res.sendStatus(200);
  try {
    await Contact.init();
    const signal = AbortSignal.timeout(9000);
    for (let index = 0; index < events.length; index += 6) {
      signal.throwIfAborted();
      const results = await Promise.allSettled(events.slice(index, index + 6).map((event) => ingestLead(event, config, signal)));
      if (results.some((result) => result.status === "rejected")) throw new Error("Meta lead intake incomplete.");
    }
    return res.sendStatus(200);
  } catch {
    console.warn("Meta lead intake incomplete; returning a retryable response.");
    return res.sendStatus(503);
  }
});

// Keep malformed bodies and secrets out of generic logs.
router.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  return res.sendStatus(error.status || 500);
});

export default router;
