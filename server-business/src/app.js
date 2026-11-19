"use strict";
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { isDatabaseConnected } = require("./config/database");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/users/user.routes");
const applicantRoutes = require("./modules/applicants/applicant.routes");
const jobRoutes = require("./modules/jobs/job.routes");
const analyticsRoutes = require("./modules/jobs/analytics.routes");
const app = express();
app.disable("x-powered-by");
app.use(requestLogger);
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again later.",
      },
    },
  }),
);
app.get("/api/health", (req, res) =>
  res
    .status(200)
    .json({
      success: true,
      data: {
        status: "ok",
        database: isDatabaseConnected() ? "connected" : "disconnected",
        uptimeSeconds: Math.floor(process.uptime()),
      },
    }),
);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/applicants", applicantRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use((req, res) =>
  res
    .status(404)
    .json({
      success: false,
      error: {
        code: "ROUTE_NOT_FOUND",
        message: "The requested endpoint does not exist",
      },
      requestId: req.requestId,
    }),
);
app.use(errorHandler);
module.exports = app;
