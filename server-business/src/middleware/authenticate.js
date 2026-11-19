"use strict";
const jwt = require("jsonwebtoken");
const User = require("../modules/users/user.model");
const AppError = require("../shared/errors/AppError");
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
function authenticate(req, res, next) {
  const header = req.get("authorization");
  if (!header || !header.startsWith("Bearer "))
    return res
      .status(401)
      .json({
        success: false,
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Please sign in to continue",
        },
      });
  let payload;
  try {
    payload = jwt.verify(header.slice(7).trim(), getJwtSecret(), {
      algorithms: ["HS256"],
    });
  } catch (err) {
    return next(
      err.statusCode === 500
        ? err
        : new AppError(
            "Your session is invalid or expired",
            401,
            "INVALID_TOKEN",
          ),
    );
  }
  if (
    !payload ||
    typeof payload.sub !== "string" ||
    !Number.isInteger(payload.tokenVersion) ||
    !["admin", "recruiter", "user"].includes(payload.role)
  )
    return next(new AppError("Your session is invalid", 401, "INVALID_TOKEN"));
  User.findById(payload.sub)
    .select("_id role tokenVersion")
    .lean()
    .then((user) => {
      if (
        !user ||
        user.tokenVersion !== payload.tokenVersion ||
        user.role !== payload.role
      )
        return res
          .status(401)
          .json({
            success: false,
            error: {
              code: "SESSION_REVOKED",
              message: "Your session is no longer valid. Please sign in again.",
            },
          });
      req.user = Object.freeze({ id: user._id.toString(), role: user.role });
      next();
    })
    .catch(next);
}
module.exports = authenticate;
