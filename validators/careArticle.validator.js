const { body } = require("express-validator");
const { CATEGORIES } = require("../models/CareArticle");

const createArticleValidator = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("content").notEmpty().withMessage("Content is required"),
  body("category").isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(", ")}`),
  body("excerpt").optional().isLength({ max: 300 }).withMessage("Excerpt must be under 300 characters"),
];

module.exports = { createArticleValidator };
