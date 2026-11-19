"use strict";
const express = require("express");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const Applicant = require("../applicants/applicant.model");
const Job = require("./job.model");
const router = express.Router();
router.use(authenticate, authorize("admin"));
router.get("/", async (req, res, next) => {
  try {
    const [
      totalApplicants,
      statusCounts,
      totalJobs,
      openJobs,
      recentApplicants,
    ] = await Promise.all([
      Applicant.countDocuments(),
      Applicant.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Job.countDocuments(),
      Job.countDocuments({ status: "open" }),
      Applicant.find().sort({ createdAt: -1 }).limit(6).lean(),
    ]);
    const byStatus = {
      applied: 0,
      screening: 0,
      interview: 0,
      hired: 0,
      rejected: 0,
    };
    statusCounts.forEach((x) => (byStatus[x._id] = x.count));
    res.json({
      success: true,
      data: {
        totalApplicants,
        totalJobs,
        openJobs,
        interviews: byStatus.interview,
        hired: byStatus.hired,
        byStatus,
        recentApplicants,
      },
    });
  } catch (e) {
    next(e);
  }
});
module.exports = router;
