const { body } = require("express-validator");

const createProductReviewValidator = [
  body("product").notEmpty().withMessage("Product is required"),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment").optional().isLength({ max: 1000 }).withMessage("Comment must be under 1000 characters"),
];

const createVetReviewValidator = [
  body("veterinarian").notEmpty().withMessage("Veterinarian is required"),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment").optional().isLength({ max: 1000 }).withMessage("Comment must be under 1000 characters"),
];

module.exports = { createProductReviewValidator, createVetReviewValidator };
