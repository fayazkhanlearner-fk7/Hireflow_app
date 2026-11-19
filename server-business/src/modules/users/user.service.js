"use strict";
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./user.model");
const AppError = require("../../shared/errors/AppError");
function validateId(id) {
  if (!mongoose.isObjectIdOrHexString(id))
    throw new AppError("User ID is invalid", 400, "INVALID_ID");
}
function safeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
async function getById(id) {
  validateId(id);
  const user = await User.findById(id).lean();
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  return safeUser(user);
}
async function listUsers({ page = 1, limit = 20 } = {}) {
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
  const [items, total] = await Promise.all([
    User.find().sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(),
  ]);
  return {
    items: items.map(safeUser),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}
async function updateProfile(id, data) {
  validateId(id);
  const update = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.email !== undefined) update.email = data.email.toLowerCase();
  if (!Object.keys(update).length)
    throw new AppError(
      "Provide at least one field to update",
      400,
      "EMPTY_UPDATE",
    );
  try {
    const user = await User.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true },
    ).lean();
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    return safeUser(user);
  } catch (err) {
    if (err.code === 11000)
      throw new AppError(
        "Email address is already registered",
        409,
        "EMAIL_ALREADY_EXISTS",
      );
    throw err;
  }
}
async function updateRole(id, role, actingUserId) {
  validateId(id);
  if (!["admin", "recruiter", "user"].includes(role))
    throw new AppError("Role is invalid", 400, "INVALID_ROLE");
  const target = await User.findById(id);
  if (!target) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  if (id === actingUserId && role !== "admin")
    throw new AppError(
      "You cannot remove your own administrator role",
      400,
      "SELF_DEMOTION_NOT_ALLOWED",
    );
  if (target.role === "admin" && role !== "admin") {
    const count = await User.countDocuments({ role: "admin" });
    if (count <= 1)
      throw new AppError(
        "The last administrator cannot be demoted",
        409,
        "LAST_ADMIN_PROTECTED",
      );
  }
  target.role = role;
  target.tokenVersion = (target.tokenVersion || 0) + 1;
  await target.save();
  return safeUser(target);
}
async function changePassword(id, currentPassword, newPassword) {
  validateId(id);
  const user = await User.findById(id).select("+passwordHash");
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok)
    throw new AppError(
      "Current password is incorrect",
      400,
      "CURRENT_PASSWORD_INCORRECT",
    );
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.tokenVersion += 1;
  await user.save();
  return { message: "Password changed successfully. Please sign in again." };
}
module.exports = {
  getById,
  listUsers,
  updateProfile,
  updateRole,
  changePassword,
};
