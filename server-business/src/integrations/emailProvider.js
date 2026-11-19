"use strict";
const nodemailer = require("nodemailer");
let transporter;
function getTransporter() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    const error = new Error("Email provider is not configured");
    error.status = 503;
    error.code = "EMAIL_PROVIDER_NOT_CONFIGURED";
    throw error;
  }
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    if (!Number.isInteger(port) || port < 1 || port > 65535)
      throw new Error("SMTP_PORT must be a valid port");
    const secure =
      process.env.SMTP_SECURE === undefined
        ? port === 465
        : process.env.SMTP_SECURE.toLowerCase() === "true";
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}
async function sendEmail({ to, subject, text, html }) {
  if (typeof to !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to))
    throw new TypeError("A valid recipient email address is required");
  if (typeof subject !== "string" || !subject.trim())
    throw new TypeError("Email subject is required");
  if (
    !(typeof text === "string" && text.trim()) &&
    !(typeof html === "string" && html.trim())
  )
    throw new TypeError("Email text or HTML content is required");
  if (!process.env.EMAIL_FROM) {
    const error = new Error("EMAIL_FROM is not configured");
    error.status = 503;
    error.code = "EMAIL_PROVIDER_NOT_CONFIGURED";
    throw error;
  }
  const result = await getTransporter().sendMail({
    from: process.env.EMAIL_FROM,
    to: to.trim(),
    subject: subject.trim(),
    ...(text ? { text } : {}),
    ...(html ? { html } : {}),
  });
  return {
    messageId: result.messageId,
    accepted: result.accepted,
    rejected: result.rejected,
  };
}
function closeEmailProvider() {
  if (transporter) {
    transporter.close();
    transporter = null;
  }
}
module.exports = { sendEmail, closeEmailProvider };
