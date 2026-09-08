const { body } = require("express-validator");
const { SPECIES, ADOPTION_STATUSES } = require("../models/ShelterPet");

const createShelterPetValidator = [
  body("name").trim().notEmpty().withMessage("Pet name is required"),
  body("species").isIn(SPECIES).withMessage(`Species must be one of: ${SPECIES.join(", ")}`),
  body("gender").optional().isIn(["Male", "Female", "Unknown"]).withMessage("Invalid gender"),
  body("age").optional().isFloat({ min: 0 }).withMessage("Age must be a positive number"),
];

const updateAdoptionStatusValidator = [
  body("adoptionStatus")
    .isIn(ADOPTION_STATUSES)
    .withMessage(`Status must be one of: ${ADOPTION_STATUSES.join(", ")}`),
];

module.exports = { createShelterPetValidator, updateAdoptionStatusValidator };
