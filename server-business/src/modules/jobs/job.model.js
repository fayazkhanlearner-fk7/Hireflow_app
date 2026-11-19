"use strict";
const mongoose = require("mongoose");
const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    department: { type: String, default: "General", trim: true },
    location: { type: String, default: "Remote", trim: true },
    type: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship"],
      default: "Full-time",
    },
    status: {
      type: String,
      enum: ["open", "paused", "closed"],
      default: "open",
    },
    description: { type: String, default: "", maxlength: 5000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.models.Job || mongoose.model("Job", jobSchema);
