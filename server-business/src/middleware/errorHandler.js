"use strict";
const logger = require("../config/logger");
module.exports = function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  let status = Number(err.statusCode || err.status) || 500;
  let code = err.code || "INTERNAL_SERVER_ERROR";
  let message = err.message || "An unexpected error occurred";
  let details = err.details;
  if (err.name === "ValidationError") {
    status = 400;
    code = "VALIDATION_ERROR";
    message = "Please check the submitted information";
    details = Object.values(err.errors || {}).map((item) => ({
      field: item.path,
      message: item.message,
    }));
  }
  if (err.name === "CastError") {
    status = 400;
    code = "INVALID_ID";
    message = "The supplied identifier is invalid";
  }
  if (err.code === 11000) {
    status = 409;
    code = "DUPLICATE_VALUE";
    message = "A record with this value already exists";
  }
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    status = 400;
    code = "INVALID_JSON";
    message = "Request body contains invalid JSON";
  }
  if (status >= 500) {
    logger.error("Request failed", {
      requestId: req.requestId,
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    if (process.env.NODE_ENV === "production")
      message = "An unexpected server error occurred";
  }
  const payload = { success: false, error: { code, message } };
  if (details !== undefined) payload.error.details = details;
  if (req.requestId) payload.requestId = req.requestId;
  res.status(status).json(payload);
};
