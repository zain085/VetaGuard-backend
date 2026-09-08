const { body } = require("express-validator");

const upsertShelterValidator = [
  body("shelterName").trim().notEmpty().withMessage("Shelter name is required"),
  body("phone").optional().trim(),
  body("website").optional().trim().isURL().withMessage("Website must be a valid URL"),
];

module.exports = { upsertShelterValidator };
