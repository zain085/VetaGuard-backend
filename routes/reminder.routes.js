const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validation.middleware");
const { createReminderValidator } = require("../validators/reminder.validator");
const {
  createReminder, getReminders, updateReminder, deleteReminder,
} = require("../controllers/reminder.controller");

const router = express.Router();

router.use(protect);

router.post("/", createReminderValidator, validate, createReminder);
router.get("/", getReminders);
router.patch("/:id", updateReminder);
router.delete("/:id", deleteReminder);

module.exports = router;
