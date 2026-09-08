const { body } = require("express-validator");

const upsertVetProfileValidator = [
  body("specialization").trim().notEmpty().withMessage("Specialization is required"),
  body("experience").optional().isFloat({ min: 0 }).withMessage("Experience must be a positive number"),
  body("consultationFee").optional().isFloat({ min: 0 }).withMessage("Consultation fee must be a positive number"),
  body("services").optional().isArray().withMessage("Services must be a list"),
  body("availability").optional().isArray().withMessage("Availability must be a list"),
  body("availability.*.dayOfWeek")
    .optional()
    .isInt({ min: 0, max: 6 })
    .withMessage("dayOfWeek must be 0-6 (Sunday-Saturday)"),
  body("availability.*.startTime")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("startTime must be in HH:MM format"),
  body("availability.*.endTime")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("endTime must be in HH:MM format"),
];

module.exports = { upsertVetProfileValidator };
