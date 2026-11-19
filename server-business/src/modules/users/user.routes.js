"use strict";
const express = require("express");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const controller = require("./user.controller");
const v = require("./user.validation");
const router = express.Router();
router.use(authenticate);
router.get("/me", controller.getMe);
router.patch("/me", v.validate(v.updateProfileSchema), controller.updateMe);
router.patch(
  "/me/password",
  v.validate(v.changePasswordSchema),
  controller.changePassword,
);
router.get(
  "/",
  authorize("admin"),
  v.validate(v.listUsersQuerySchema, "query"),
  controller.listUsers,
);
router.get(
  "/:id",
  authorize("admin"),
  v.validate(v.userIdParamsSchema, "params"),
  controller.getUserById,
);
router.patch(
  "/:id/role",
  authorize("admin"),
  v.validate(v.userIdParamsSchema, "params"),
  v.validate(v.updateRoleSchema),
  controller.updateRole,
);
module.exports = router;
