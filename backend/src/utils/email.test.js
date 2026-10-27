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
