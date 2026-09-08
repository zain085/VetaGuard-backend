const mongoose = require("mongoose");

const REMINDER_TYPES = ["feeding", "grooming", "vaccination", "medication", "appointment", "custom"];

const reminderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pet: { type: mongoose.Schema.Types.ObjectId, ref: "Pet" },
    type: { type: String, enum: REMINDER_TYPES, default: "custom" },
    title: { type: String, required: [true, "Title is required"], trim: true },
    description: { type: String, trim: true, maxlength: 500 },
    dueDate: { type: Date, required: [true, "Due date is required"] },
    repeat: { type: String, enum: ["none", "daily", "weekly", "monthly"], default: "none" },
    status: { type: String, enum: ["pending", "completed", "dismissed"], default: "pending" },
  },
  { timestamps: true }
);

reminderSchema.index({ user: 1, dueDate: 1 });
reminderSchema.index({ status: 1 });

module.exports = mongoose.model("Reminder", reminderSchema);
module.exports.REMINDER_TYPES = REMINDER_TYPES;
