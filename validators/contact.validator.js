const { body } = require("express-validator");

const createContactMessageValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("A valid email is required"),
  body("message").trim().notEmpty().withMessage("Message is required"),
];

module.exports = { createContactMessageValidator };
