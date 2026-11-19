"use strict";
const { z } = require("zod");
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Must be a valid ID");
const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((v) => v.toLowerCase())
      .optional(),
  })
  .strict()
  .refine(
    (v) => Object.keys(v).length > 0,
    "Provide at least one field to update",
  );
const updateRoleSchema = z
  .object({ role: z.enum(["admin", "recruiter", "user"]) })
  .strict();
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(12).max(128),
  })
  .strict()
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: "New password must differ from current password",
    path: ["newPassword"],
  });
const listUsersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
const userIdParamsSchema = z.object({ id: objectId }).strict();
function validate(schema, property = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[property]);
    if (!result.success)
      return res
        .status(400)
        .json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Please check the submitted information",
            details: result.error.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message,
            })),
          },
        });
    req.validated = req.validated || {};
    req.validated[property] = result.data;
    next();
  };
}
module.exports = {
  updateProfileSchema,
  updateRoleSchema,
  changePasswordSchema,
  listUsersQuerySchema,
  userIdParamsSchema,
  validate,
};
