const { body } = require("express-validator");
const { REMINDER_TYPES } = require("../models/Reminder");

const createReminderValidator = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("dueDate").isISO8601().withMessage("A valid due date is required"),
  body("type").optional().isIn(REMINDER_TYPES).withMessage(`Type must be one of: ${REMINDER_TYPES.join(", ")}`),
  body("repeat").optional().isIn(["none", "daily", "weekly", "monthly"]).withMessage("Invalid repeat value"),
];

module.exports = { createReminderValidator };
