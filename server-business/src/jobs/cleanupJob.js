"use strict";
const logger = require("../config/logger");
let cleanupInterval = null;
async function runCleanup() {
  logger.info("Cleanup job started"); // Intentionally no automatic deletion until a retention policy is defined.
  logger.info("Cleanup job completed");
}
function startCleanupJob(intervalMs = 24 * 60 * 60 * 1000) {
  if (cleanupInterval) return;
  if (!Number.isSafeInteger(intervalMs) || intervalMs < 1000)
    throw new Error("Cleanup interval must be at least 1000 milliseconds");
  cleanupInterval = setInterval(
    () =>
      runCleanup().catch((error) =>
        logger.error("Cleanup job failed", { message: error.message }),
      ),
    intervalMs,
  );
  cleanupInterval.unref?.();
}
function stopCleanupJob() {
  if (cleanupInterval) clearInterval(cleanupInterval);
  cleanupInterval = null;
}
module.exports = { runCleanup, startCleanupJob, stopCleanupJob };
