const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validation.middleware");
const {
  registerValidator,
  loginValidator,
  changePasswordValidator,
} = require("../validators/auth.validator");
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfile);
router.patch("/change-password", protect, changePasswordValidator, validate, changePassword);

module.exports = router;
