"use strict";
const express = require("express");
const mongoose = require("mongoose");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const Job = require("./job.model");
const Applicant = require("../applicants/applicant.model");
const router = express.Router();
router.use(authenticate, authorize("admin", "recruiter"));
router.get("/", async (req, res, next) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: jobs });
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      title,
      department = "General",
      location = "Remote",
      type = "Full-time",
      status,
      description,
    } = req.body;

    if (typeof title !== "string" || title.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Job title must contain at least 2 characters",
        },
      });
    }

    // Escape special regex characters in user input.
    const escapeRegex = (value) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Prevent duplicate jobs with the same core details.
    const existingJob = await Job.findOne({
      title: {
        $regex: `^${escapeRegex(title.trim())}$`,
        $options: "i",
      },
      department: {
        $regex: `^${escapeRegex(department.trim())}$`,
        $options: "i",
      },
      location: {
        $regex: `^${escapeRegex(location.trim())}$`,
        $options: "i",
      },
      type,
    });

    if (existingJob) {
      return res.status(409).json({
        success: false,
        message: "A job with these details already exists.",
      });
    }

    const job = await Job.create({
      title: title.trim(),
      department: department.trim(),
      location: location.trim(),
      type,
      status,
      description,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      data: job,
    });
  } catch (e) {
    next(e);
  }
});


router.patch("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res
        .status(400)
        .json({ success: false, error: { message: "Invalid job ID" } });
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!job)
      return res
        .status(404)
        .json({ success: false, error: { message: "Job not found" } });
    res.json({ success: true, data: job });
  } catch (e) {
    next(e);
  }
});
router.delete("/:id",authorize("admin"),
async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res
        .status(400)
        .json({ success: false, error: { message: "Invalid job ID" } });
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job)
      return res
        .status(404)
        .json({ success: false, error: { message: "Job not found" } });
    res.json({ success: true, message: "Job deleted" });
  } catch (e) {
    next(e);
  }
});
router.get("/:id/applicants", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res
        .status(400)
        .json({ success: false, error: { message: "Invalid job ID" } });
    const job = await Job.findById(req.params.id);
    if (!job)
      return res
        .status(404)
        .json({ success: false, error: { message: "Job not found" } });
    const list = await Applicant.find({ role: job.title })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: { job, applicants: list } });
  } catch (e) {
    next(e);
  }
});
module.exports = router;
