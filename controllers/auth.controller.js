const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const User = require("../models/User");
const { generateToken, setAuthCookie, clearAuthCookie } = require("../utils/generateToken");

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, address, city, state, country } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }

  // Admin accounts are never publicly registerable
  const safeRole = ["owner", "vet", "shelter"].includes(role) ? role : "owner";

  const user = await User.create({
    name,
    email,
    password,
    role: safeRole,
    phone,
    address,
    city,
    state,
    country,
  });

  const token = generateToken(user._id);
  setAuthCookie(res, token);

  sendSuccess(res, 201, "Account created successfully", { user: user.toSafeObject() });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "This account has been deactivated");
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);
  setAuthCookie(res, token);

  sendSuccess(res, 200, "Logged in successfully", { user: user.toSafeObject() });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  sendSuccess(res, 200, "Logged out successfully", {});
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, "Current user retrieved", { user: req.user.toSafeObject() });
});

// PATCH /api/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ["name", "phone", "address", "city", "state", "country"];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  sendSuccess(res, 200, "Profile updated successfully", { user: user.toSafeObject() });
});

// PATCH /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  sendSuccess(res, 200, "Password changed successfully", {});
});

module.exports = { register, login, logout, getMe, updateProfile, changePassword };
