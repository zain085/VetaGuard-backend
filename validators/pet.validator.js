const { body } = require("express-validator");

const SPECIES = ["Dog", "Cat", "Bird", "Rabbit", "Other"];
const GENDERS = ["Male", "Female", "Unknown"];

const createPetValidator = [
  body("name").trim().notEmpty().withMessage("Pet name is required"),
  body("species").isIn(SPECIES).withMessage(`Species must be one of: ${SPECIES.join(", ")}`),
  body("breed").optional().trim(),
  body("gender").optional().isIn(GENDERS).withMessage("Invalid gender"),
  body("dateOfBirth").optional().isISO8601().withMessage("Invalid date of birth"),
  body("weight").optional().isFloat({ min: 0 }).withMessage("Weight must be a positive number"),
  body("allergies").optional().isArray().withMessage("Allergies must be a list"),
  body("chronicConditions").optional().isArray().withMessage("Chronic conditions must be a list"),
];

const updatePetValidator = [
  body("name").optional().trim().notEmpty().withMessage("Pet name cannot be empty"),
  body("species").optional().isIn(SPECIES).withMessage(`Species must be one of: ${SPECIES.join(", ")}`),
  body("gender").optional().isIn(GENDERS).withMessage("Invalid gender"),
  body("dateOfBirth").optional().isISO8601().withMessage("Invalid date of birth"),
  body("weight").optional().isFloat({ min: 0 }).withMessage("Weight must be a positive number"),
];

module.exports = { createPetValidator, updatePetValidator };
