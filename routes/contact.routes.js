const express = require("express");
const rateLimit = require("express-rate-limit");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const validate = require("../middleware/validation.middleware");
const { createContactMessageValidator } = require("../validators/contact.validator");
const {
  submitContactMessage, listContactMessages, updateContactMessageStatus,
} = require("../controllers/contact.controller");

const router = express.Router();

// Public contact form is rate-limited to deter spam/abuse
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many messages sent — please try again later.", errors: [] },
});

router.post("/", contactLimiter, createContactMessageValidator, validate, submitContactMessage);
router.get("/", protect, authorize("admin"), listContactMessages);
router.patch("/:id/status", protect, authorize("admin"), updateContactMessageStatus);

module.exports = router;
