"use strict";
const Applicant = require("./applicant.model");
async function create(data) {
  return Applicant.create(data);
}
async function findById(id) {
  return Applicant.findById(id).lean();
}
async function updateById(id, data) {
  return Applicant.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true },
  ).lean();
}
async function deleteById(id) {
  return Applicant.findByIdAndDelete(id).lean();
}
async function list(filter, skip, limit) {
  return Promise.all([
    Applicant.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Applicant.countDocuments(filter),
  ]);
}
module.exports = { create, findById, updateById, deleteById, list };
