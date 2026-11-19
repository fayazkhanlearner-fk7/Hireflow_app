"use strict";
const mongoose = require("mongoose");
const repository = require("./applicant.repository");
const AppError = require("../../shared/errors/AppError");
function validateId(id) {
  if (!mongoose.isObjectIdOrHexString(id))
    throw new AppError("Applicant ID is invalid", 400, "INVALID_ID");
}
async function create(data, userId) {
  return repository.create({
    ...data,
    email: data.email.toLowerCase(),
    createdBy: userId,
  });
}
async function getById(id) {
  validateId(id);
  const item = await repository.findById(id);
  if (!item)
    throw new AppError("Applicant not found", 404, "APPLICANT_NOT_FOUND");
  return item;
}
async function list({ page = 1, limit = 20, status, search } = {}) {
  const skip = (page - 1) * limit;
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    skip > 100000
  )
    throw new AppError(
      "Pagination values are invalid",
      400,
      "INVALID_PAGINATION",
    );
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
      { role: { $regex: safe, $options: "i" } },
    ];
  }
  const [items, total] = await repository.list(filter, skip, limit);
  return {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}
async function update(id, data) {
  validateId(id);
  const item = await repository.updateById(id, data);
  if (!item)
    throw new AppError("Applicant not found", 404, "APPLICANT_NOT_FOUND");
  return item;
}
async function remove(id) {
  validateId(id);
  const item = await repository.deleteById(id);
  if (!item)
    throw new AppError("Applicant not found", 404, "APPLICANT_NOT_FOUND");
  return item;
}
module.exports = { create, getById, list, update, remove };
