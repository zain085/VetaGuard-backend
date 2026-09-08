const mongoose = require("mongoose");

const vetReviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    veterinarian: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000 },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One review per user per vet
vetReviewSchema.index({ veterinarian: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("VetReview", vetReviewSchema);
