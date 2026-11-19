"use strict";
const mongoose = require("mongoose");
const applicantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    role: { type: String, required: true, trim: true, maxlength: 120 },
    status: {
      type: String,
      enum: ["applied", "screening", "interview", "hired", "rejected"],
      default: "applied",
      required: true,
    },
    resume: {
      filename: { type: String },
      originalName: { type: String },
      mimeType: { type: String },
      size: { type: Number },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);
applicantSchema.index({ email: 1, role: 1 });
applicantSchema.index({ status: 1, createdAt: -1 });
module.exports =
  mongoose.models.Applicant || mongoose.model("Applicant", applicantSchema);
