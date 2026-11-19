"use strict";
const validRoles = new Set(["admin", "recruiter", "user"]);
function authorize(...allowedRoles) {
  if (
    !allowedRoles.length ||
    allowedRoles.some((role) => !validRoles.has(role))
  )
    throw new Error("authorize() requires explicitly allowed valid roles");
  return function authorizationMiddleware(req, res, next) {
    if (!req.user)
      return res
        .status(401)
        .json({
          success: false,
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "Please sign in to continue",
          },
        });
    if (!allowedRoles.includes(req.user.role))
      return res
        .status(403)
        .json({
          success: false,
          error: {
            code: "INSUFFICIENT_PERMISSIONS",
            message: "You do not have permission to perform this action",
          },
        });
    next();
  };
}
module.exports = authorize;
