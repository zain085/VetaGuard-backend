const mongoose = require("mongoose");

const STATUSES = ["pending", "confirmed", "rescheduled", "completed", "cancelled", "rejected"];

const appointmentSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pet: { type: mongoose.Schema.Types.ObjectId, ref: "Pet", required: true },
    veterinarian: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: [true, "Appointment date is required"] }, // date only (midnight UTC)
    time: { type: String, required: [true, "Appointment time slot is required"] }, // "09:00"
    reason: { type: String, trim: true, required: [true, "Reason for visit is required"] },
    symptoms: [{ type: String, trim: true }],
    notes: { type: String, trim: true, maxlength: 1000 }, // vet's visit notes
    treatmentSummary: { type: String, trim: true, maxlength: 2000 }, // filled on completion
    status: { type: String, enum: STATUSES, default: "pending" },
    cancellationReason: { type: String, trim: true },
  },
  { timestamps: true }
);

// Prevent double-booking the same vet at the same date+time (except cancelled/rejected slots)
appointmentSchema.index(
  { veterinarian: 1, date: 1, time: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "confirmed", "rescheduled"] } },
  }
);
appointmentSchema.index({ owner: 1, date: -1 });
appointmentSchema.index({ status: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
module.exports.STATUSES = STATUSES;
