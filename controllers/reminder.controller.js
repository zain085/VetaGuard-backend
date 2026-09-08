const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const Reminder = require("../models/Reminder");

// POST /api/reminders
const createReminder = asyncHandler(async (req, res) => {
  const reminder = await Reminder.create({ ...req.body, user: req.user._id });
  sendSuccess(res, 201, "Reminder created successfully", { reminder });
});

// GET /api/reminders  (mine, optionally filtered by status)
const getReminders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { user: req.user._id };
  if (status) filter.status = status;

  const reminders = await Reminder.find(filter).sort({ dueDate: 1 }).populate("pet", "name species");
  sendSuccess(res, 200, "Reminders retrieved successfully", { reminders });
});

// PATCH /api/reminders/:id
const updateReminder = asyncHandler(async (req, res) => {
  const reminder = await Reminder.findById(req.params.id);
  if (!reminder) throw new ApiError(404, "Reminder not found");
  if (reminder.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You do not own this reminder");
  }

  const allowedFields = ["title", "description", "dueDate", "repeat", "status", "type", "pet"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) reminder[field] = req.body[field];
  });
  await reminder.save();

  sendSuccess(res, 200, "Reminder updated successfully", { reminder });
});

// DELETE /api/reminders/:id
const deleteReminder = asyncHandler(async (req, res) => {
  const reminder = await Reminder.findById(req.params.id);
  if (!reminder) throw new ApiError(404, "Reminder not found");
  if (reminder.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You do not own this reminder");
  }
  await reminder.deleteOne();
  sendSuccess(res, 200, "Reminder deleted successfully", {});
});

module.exports = { createReminder, getReminders, updateReminder, deleteReminder };
