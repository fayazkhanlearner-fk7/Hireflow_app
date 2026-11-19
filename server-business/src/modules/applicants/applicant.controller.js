"use strict";
const asyncHandler = require("../../middleware/asyncHandler");
const service = require("./applicant.service");
exports.listApplicants = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.list(req.validated.query) }),
);
exports.getApplicantById = asyncHandler(async (req, res) =>
  res.json({
    success: true,
    data: await service.getById(req.validated.params.id),
  }),
);
exports.createApplicant = asyncHandler(async (req, res) =>
  res
    .status(201)
    .json({
      success: true,
      data: await service.create(req.validated.body, req.user.id),
    }),
);
exports.updateApplicant = asyncHandler(async (req, res) =>
  res.json({
    success: true,
    data: await service.update(req.validated.params.id, req.validated.body),
  }),
);
exports.deleteApplicant = asyncHandler(async (req, res) => {
  await service.remove(req.validated.params.id);
  res.json({ success: true, message: "Applicant deleted successfully" });
});
