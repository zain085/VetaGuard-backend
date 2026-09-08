const { body } = require("express-validator");
const { RECORD_TYPES } = require("../models/MedicalRecord");

const createMedicalRecordValidator = [
  body("recordType").isIn(RECORD_TYPES).withMessage(`Record type must be one of: ${RECORD_TYPES.join(", ")}`),
  body("diagnosis").optional().trim(),
  body("treatment").optional().trim(),
  body("followUpDate").optional().isISO8601().withMessage("Invalid follow-up date"),
];

module.exports = { createMedicalRecordValidator };
