"use strict";
const asyncHandler = require("../../middleware/asyncHandler");
const authService = require("./auth.service");
exports.register = asyncHandler(async (req, res) =>
  res
    .status(201)
    .json({
      success: true,
      message: "Registration successful",
      data: await authService.register(req.validated.body),
    }),
);
exports.login = asyncHandler(async (req, res) =>
  res.json({
    success: true,
    data: await authService.login(req.validated.body),
  }),
);
