const { body } = require("express-validator");

const createVaccinationValidator = [
  body("vaccineName").trim().notEmpty().withMessage("Vaccine name is required"),
  body("dateAdministered").isISO8601().withMessage("A valid administered date is required"),
  body("nextDueDate").optional().isISO8601().withMessage("Invalid due date"),
  body("status").optional().isIn(["completed", "due", "overdue"]).withMessage("Invalid status"),
];

module.exports = { createVaccinationValidator };
