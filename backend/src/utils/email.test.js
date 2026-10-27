import test from "node:test";
import assert from "node:assert/strict";
import nodemailer from "nodemailer";
import { sendEmail } from "./email.js";
test("email never reports delivery when SMTP is missing outside development", async () => {
 const previous = { host: process.env.SMTP_HOST, mode: process.env.NODE_ENV };
 delete process.env.SMTP_HOST;
 try {
  process.env.NODE_ENV = "production";
  await assert.rejects(sendEmail({ to: "test@example.test", subject: "Test", html: "Test" }), /SMTP_HOST/);
  process.env.NODE_ENV = "development";
  assert.equal((await sendEmail({ to: "test@example.test", subject: "Test", html: "Test" })).delivery, "development-preview");
 } finally { for(const [key,value] of [["SMTP_HOST",previous.host],["NODE_ENV",previous.mode]]) { if(value === undefined)delete process.env[key];else process.env[key]=value; } }
});
test("configured SMTP delivery errors are propagated", async t => {
 const host=process.env.SMTP_HOST;process.env.SMTP_HOST="test.invalid";
 t.mock.method(nodemailer,"createTransport",()=>({sendMail:async()=>{throw Error("Delivery failed");}}));
 try{await assert.rejects(sendEmail({to:"test@example.test",subject:"Test",html:"Test"}),/Delivery failed/);}
 finally{if(host===undefined)delete process.env.SMTP_HOST;else process.env.SMTP_HOST=host;}
});

test("hosted email uses HTTPS and propagates provider errors", async t => {
 const { randomUUID } = await import("node:crypto");
 const previous = { key: process.env.RESEND_API_KEY, from: process.env.EMAIL_FROM };
 process.env.RESEND_API_KEY = randomUUID(); process.env.EMAIL_FROM = "CABROY <sender@example.test>";
 let fail = false;
 t.mock.method(globalThis, "fetch", async (url, options) => {
  assert.equal(url, "https://api.resend.com/emails");
  assert.deepEqual(JSON.parse(options.body).to, ["learner@example.test"]);
  return { ok: !fail, json: async () => fail ? { message: "Rejected" } : { id: "provider-message-id" } };
 });
 try {
  assert.equal((await sendEmail({to:"learner@example.test",subject:"Test",html:"Test"})).delivery,"provider-accepted");
  fail = true;
  await assert.rejects(sendEmail({to:"learner@example.test",subject:"Test",html:"Test"}),/rejected delivery/);
  delete process.env.EMAIL_FROM;
  await assert.rejects(sendEmail({to:"learner@example.test",subject:"Test",html:"Test"}),/verified sender/);
 } finally {
  for(const [key,value] of [["RESEND_API_KEY",previous.key],["EMAIL_FROM",previous.from]]){if(value===undefined)delete process.env[key];else process.env[key]=value;}
 }
});
