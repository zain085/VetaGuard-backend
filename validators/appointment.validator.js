const { body } = require("express-validator");

const createAppointmentValidator = [
  body("veterinarian").notEmpty().withMessage("Veterinarian is required"),
  body("pet").notEmpty().withMessage("Pet is required"),
  body("date").isISO8601().withMessage("A valid date is required"),
  body("time")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Time must be in HH:MM format"),
  body("reason").trim().notEmpty().withMessage("Reason for visit is required"),
  body("symptoms").optional().isArray().withMessage("Symptoms must be a list"),
];

const updateStatusValidator = [
  body("status")
    .isIn(["confirmed", "rescheduled", "completed", "cancelled", "rejected"])
    .withMessage("Invalid status"),
];

module.exports = { createAppointmentValidator, updateStatusValidator };
