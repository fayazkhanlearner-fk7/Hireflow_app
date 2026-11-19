"use strict";
const logger = require("../config/logger");
const emailProvider = require("../integrations/emailProvider");
const queue = [];
let processing = false;
function enqueueEmail(email) {
  if (!email || typeof email !== "object")
    throw new TypeError("Email details are required");
  const { to, subject, text, html } = email;
  if (typeof to !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to))
    throw new Error("A valid recipient email address is required");
  if (
    typeof subject !== "string" ||
    !subject.trim() ||
    (!(typeof text === "string" && text.trim()) &&
      !(typeof html === "string" && html.trim()))
  )
    throw new Error("Email subject and content are required");
  queue.push({
    to: to.trim(),
    subject: subject.trim(),
    ...(text ? { text } : {}),
    ...(html ? { html } : {}),
  });
}
async function processEmailQueue() {
  if (processing) return;
  processing = true;
  try {
    while (queue.length) {
      const email = queue.shift();
      try {
        await emailProvider.sendEmail(email);
        logger.info("Email delivered", { recipient: email.to });
      } catch (error) {
        logger.error("Email delivery failed", {
          recipient: email.to,
          code: error.code,
          message: error.message,
        });
      }
    }
  } finally {
    processing = false;
  }
}
module.exports = { enqueueEmail, processEmailQueue };
