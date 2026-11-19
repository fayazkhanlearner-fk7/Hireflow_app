"use strict";
const { loadEnv } = require("./config/env");
const logger = require("./config/logger");
const { connectDatabase, disconnectDatabase } = require("./config/database");
const app = require("./app");
async function startServer() {
  const config = loadEnv();
  await connectDatabase(config.mongoUri);
  const server = app.listen(config.port, () =>
    logger.info("API server listening", {
      port: config.port,
      environment: config.nodeEnv,
    }),
  );
  let shuttingDown = false;
  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info("Server shutdown requested", { signal });
    server.close(async (error) => {
      try {
        await disconnectDatabase();
      } catch (dbError) {
        logger.error("Database shutdown failed", { message: dbError.message });
      }
      if (error) {
        logger.error("HTTP server shutdown failed", { message: error.message });
        process.exitCode = 1;
      }
      process.exit();
    });
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000).unref();
  }
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  return server;
}
if (require.main === module)
  startServer().catch((error) => {
    logger.error("Server failed to start", { message: error.message });
    process.exitCode = 1;
  });
module.exports = { startServer };
