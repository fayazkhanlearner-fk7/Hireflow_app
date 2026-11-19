"use strict";
const express = require("express");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const controller = require("./applicant.controller");
const v = require("./applicant.validation");
const router = express.Router();
router.use(authenticate);
router.get(
  "/",
  authorize("admin", "recruiter"),
  v.validate(v.listApplicantsQuerySchema, "query"),
  controller.listApplicants,
);
router.get(
  "/:id",
  authorize("admin", "recruiter"),
  v.validate(v.applicantIdParamsSchema, "params"),
  controller.getApplicantById,
);
router.post(
  "/",
  authorize("admin", "recruiter"),
  v.validate(v.createApplicantSchema),
  controller.createApplicant,
);
router.put(
  "/:id",
  authorize("admin", "recruiter"),
  v.validate(v.applicantIdParamsSchema, "params"),
  v.validate(v.updateApplicantSchema),
  controller.updateApplicant,
);
router.patch(
  "/:id",
  authorize("admin", "recruiter"),
  v.validate(v.applicantIdParamsSchema, "params"),
  v.validate(v.updateApplicantSchema),
  controller.updateApplicant,
);
router.delete(
  "/:id",
  authorize("admin"),
  v.validate(v.applicantIdParamsSchema, "params"),
  controller.deleteApplicant,
);
module.exports = router;
