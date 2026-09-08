const mongoose = require("mongoose");

const APPLICATION_STATUSES = [
  "pending", "under_review", "approved", "rejected", "withdrawn", "completed",
];

const adoptionApplicationSchema = new mongoose.Schema(
  {
    shelterPet: { type: mongoose.Schema.Types.ObjectId, ref: "ShelterPet", required: true },
    shelter: { type: mongoose.Schema.Types.ObjectId, ref: "Shelter", required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, trim: true, required: [true, "Please share why you'd like to adopt"] },
    experience: { type: String, trim: true, maxlength: 1500 },
    householdInfo: { type: String, trim: true, maxlength: 1000 },
    housingType: {
      type: String,
      enum: ["House", "Apartment", "Condo", "Farm", "Other"],
    },
    hasOtherPets: { type: Boolean, default: false },
    otherPetDetails: { type: String, trim: true },
    contactPreference: { type: String, enum: ["email", "phone"], default: "email" },
    status: { type: String, enum: APPLICATION_STATUSES, default: "pending" },
    shelterNotes: { type: String, trim: true, maxlength: 1000 },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

// One active application per applicant per pet — prevents duplicate spam applications
adoptionApplicationSchema.index(
  { shelterPet: 1, applicant: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "under_review", "approved"] } },
  }
);
adoptionApplicationSchema.index({ shelter: 1, status: 1 });
adoptionApplicationSchema.index({ applicant: 1 });

module.exports = mongoose.model("AdoptionApplication", adoptionApplicationSchema);
module.exports.APPLICATION_STATUSES = APPLICATION_STATUSES;
