const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true, trim: true }, // e.g. "appointment_confirmed", "adoption_status", "reminder_due"
    title: { type: String, required: true, trim: true },
    message: { type: String, trim: true, maxlength: 500 },
    relatedEntity: { type: String, trim: true }, // e.g. "Appointment", "AdoptionApplication", "Reminder"
    relatedEntityId: { type: mongoose.Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
