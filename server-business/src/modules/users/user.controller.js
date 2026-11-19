"use strict";
const asyncHandler = require("../../middleware/asyncHandler");
const userService = require("./user.service");
exports.getMe = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await userService.getById(req.user.id) }),
);
exports.listUsers = asyncHandler(async (req, res) =>
  res.json({
    success: true,
    data: await userService.listUsers(req.validated.query),
  }),
);
exports.getUserById = asyncHandler(async (req, res) =>
  res.json({
    success: true,
    data: await userService.getById(req.validated.params.id),
  }),
);
exports.updateMe = asyncHandler(async (req, res) =>
  res.json({
    success: true,
    data: await userService.updateProfile(req.user.id, req.validated.body),
  }),
);
exports.updateRole = asyncHandler(async (req, res) =>
  res.json({
    success: true,
    data: await userService.updateRole(
      req.validated.params.id,
      req.validated.body.role,
      req.user.id,
    ),
  }),
);
exports.changePassword = asyncHandler(async (req, res) =>
  res.json({
    success: true,
    data: await userService.changePassword(
      req.user.id,
      req.validated.body.currentPassword,
      req.validated.body.newPassword,
    ),
  }),
);
