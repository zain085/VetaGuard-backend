const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

// Run after express-validator chains; collects errors into a consistent shape
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  next(new ApiError(422, "Validation failed", errors));
}

module.exports = validate;
