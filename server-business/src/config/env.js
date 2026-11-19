"use strict";
const dotenv = require("dotenv");
dotenv.config();
function loadEnv() {
  const nodeEnv = process.env.NODE_ENV || "development";
  if (!["development", "test", "production"].includes(nodeEnv))
    throw new Error("NODE_ENV must be development, test, or production");
  const port = Number(process.env.PORT || 5001);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT must be a valid port number");
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri && nodeEnv !== "test") throw new Error("MONGO_URI is required");
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  try {
    new URL(clientUrl);
  } catch {
    throw new Error("CLIENT_URL must be a valid URL");
  }
  return Object.freeze({ nodeEnv, port, mongoUri, clientUrl });
}
module.exports = { loadEnv };
