"use strict";
const crypto = require("node:crypto");
const logger = require("../config/logger");
module.exports = function requestLogger(req, res, next) {
  const requestId = req.get("x-request-id") || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  const started = Date.now();
  res.on("finish", () =>
    logger.info("HTTP request", {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - started,
    }),
  );
  next();
};
