"use strict";
const { z } = require("zod");
const id = z.string().regex(/^[a-f\d]{24}$/i, "Must be a valid ID");
const status = z.enum([
  "applied",
  "screening",
  "interview",
  "hired",
  "rejected",
]);
const createApplicantSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    role: z.string().trim().min(2).max(120),
    status: status.optional(),
  })
  .strict();
const updateApplicantSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((v) => v.toLowerCase())
      .optional(),
    role: z.string().trim().min(2).max(120).optional(),
    status: status.optional(),
  })
  .strict()
  .refine(
    (v) => Object.keys(v).length > 0,
    "Provide at least one field to update",
  );
const listApplicantsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: status.optional(),
    search: z.string().trim().max(100).optional(),
  })
  .strict();
const applicantIdParamsSchema = z.object({ id }).strict();
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
  createApplicantSchema,
  updateApplicantSchema,
  listApplicantsQuerySchema,
  applicantIdParamsSchema,
  validate,
};
