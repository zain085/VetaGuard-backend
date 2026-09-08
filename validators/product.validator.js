const { body } = require("express-validator");

const createProductValidator = [
  body("name").trim().notEmpty().withMessage("Product name is required"),
  body("category").notEmpty().withMessage("Category is required"),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("compareAtPrice").optional().isFloat({ min: 0 }).withMessage("Compare-at price must be a positive number"),
  body("stock").optional().isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
];

const createCategoryValidator = [
  body("name").trim().notEmpty().withMessage("Category name is required"),
];

module.exports = { createProductValidator, createCategoryValidator };
