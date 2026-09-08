const { body } = require("express-validator");

const addCartItemValidator = [
  body("product").notEmpty().withMessage("Product is required"),
  body("quantity").optional().isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
];

const updateCartItemValidator = [
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
];

module.exports = { addCartItemValidator, updateCartItemValidator };
