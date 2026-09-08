const { body } = require("express-validator");
const { APPLICATION_STATUSES } = require("../models/AdoptionApplication");

const createApplicationValidator = [
  body("shelterPet").notEmpty().withMessage("A pet is required"),
  body("reason").trim().notEmpty().withMessage("Please share why you'd like to adopt"),
  body("housingType")
    .optional()
    .isIn(["House", "Apartment", "Condo", "Farm", "Other"])
    .withMessage("Invalid housing type"),
  body("hasOtherPets").optional().isBoolean().withMessage("hasOtherPets must be true or false"),
];

const updateApplicationStatusValidator = [
  body("status")
    .isIn(APPLICATION_STATUSES.filter((s) => s !== "withdrawn"))
    .withMessage("Invalid status"),
];

module.exports = { createApplicationValidator, updateApplicationStatusValidator };
