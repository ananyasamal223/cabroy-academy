import nodemailer from "nodemailer";
export async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_HOST) {
    if (process.env.NODE_ENV === "development") return { delivery: "development-preview" };
    throw new Error("SMTP_HOST is required for email delivery.");
  }
  if (process.env.SMTP_HOST === "smtp.gmail.com" && (!process.env.SMTP_USER || !process.env.SMTP_PASS)) throw new Error("Gmail SMTP username and app password are required.");
  const transporter = nodemailer.createTransport({
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    ...(process.env.SMTP_USER ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } } : {}),
  });
  return transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, html });
}
