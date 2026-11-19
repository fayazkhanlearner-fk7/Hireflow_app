"use strict";
const mongoose = require("mongoose");
const logger = require("./logger");
async function connectDatabase(uri = process.env.MONGO_URI) {
  if (!uri) throw new Error("MONGO_URI is required to connect to MongoDB");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000, maxPoolSize: 10 });
  logger.info("MongoDB connected", { database: mongoose.connection.name });
  return mongoose.connection;
}
async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}
function isDatabaseConnected() { return mongoose.connection.readyState === 1; }
module.exports = { connectDatabase, disconnectDatabase, isDatabaseConnected };
