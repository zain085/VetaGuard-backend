const mongoose = require("mongoose");

const availabilitySlotSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number, // 0 = Sunday ... 6 = Saturday
      min: 0,
      max: 6,
      required: true,
    },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true }, // "17:00"
    slotDurationMinutes: { type: Number, default: 30, min: 10 },
  },
  { _id: false }
);

const vetProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    specialization: { type: String, trim: true, required: [true, "Specialization is required"] },
    qualification: { type: String, trim: true },
    experience: { type: Number, min: 0, default: 0 }, // years
    clinicName: { type: String, trim: true },
    clinicAddress: { type: String, trim: true },
    city: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 1500 },
    consultationFee: { type: Number, min: 0 },
    services: [{ type: String, trim: true }],
    availability: [availabilitySlotSchema],
    profileImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    latitude: { type: Number },
    longitude: { type: Number },
    isApproved: { type: Boolean, default: true }, // simple self-serve approval per SRS §7 (VetProfile note)
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

vetProfileSchema.index({ specialization: 1 });
vetProfileSchema.index({ city: 1 });
vetProfileSchema.index({ rating: -1 });

module.exports = mongoose.model("VetProfile", vetProfileSchema);
