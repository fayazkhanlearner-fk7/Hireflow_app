"use strict";
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../users/user.model");
const AppError = require("../../shared/errors/AppError");
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (typeof secret !== "string" || secret.length < 32)
    throw new AppError(
      "JWT_SECRET configuration is invalid",
      500,
      "AUTH_CONFIGURATION_ERROR",
    );
  return secret;
}
function safeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
async function register({ name, email, password }) {
  getJwtSecret();
  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail }))
    throw new AppError(
      "Email address is already registered",
      409,
      "EMAIL_ALREADY_EXISTS",
    );
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "user",
    });
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
async function login({ email, password }) {
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
    "+passwordHash",
  );
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    throw new AppError(
      "Email or password is incorrect",
      401,
      "INVALID_CREDENTIALS",
    );
  const token = jwt.sign(
    { role: user.role, tokenVersion: user.tokenVersion },
    getJwtSecret(),
    { subject: user._id.toString(), expiresIn: "15m", algorithm: "HS256" },
  );
  return { token, tokenType: "Bearer", expiresIn: 900, user: safeUser(user) };
}
module.exports = { register, login };
