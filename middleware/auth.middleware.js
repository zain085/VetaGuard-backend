const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const User = require("../models/User");
const { JWT_SECRET, JWT_COOKIE_NAME } = require("../config/env.config");

// Verifies the JWT (from httpOnly cookie) and attaches req.user
const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[JWT_COOKIE_NAME];

  if (!token) {
    throw new ApiError(401, "Not authenticated, please log in");
  }

  const decoded = jwt.verify(token, JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }

  if (!user.isActive) {
    throw new ApiError(403, "This account has been deactivated");
  }

  req.user = user;
  next();
});

module.exports = { protect };
