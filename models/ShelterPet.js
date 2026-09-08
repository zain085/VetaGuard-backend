const mongoose = require("mongoose");

const ADOPTION_STATUSES = ["available", "application_pending", "reserved", "adopted", "unavailable"];
const SPECIES = ["Dog", "Cat", "Bird", "Rabbit", "Other"];

const shelterPetSchema = new mongoose.Schema(
  {
    shelter: { type: mongoose.Schema.Types.ObjectId, ref: "Shelter", required: true },
    name: { type: String, required: [true, "Pet name is required"], trim: true },
    species: { type: String, enum: SPECIES, required: true },
    breed: { type: String, trim: true },
    gender: { type: String, enum: ["Male", "Female", "Unknown"], default: "Unknown" },
    age: { type: Number, min: 0 }, // years, approximate
    weight: { type: Number, min: 0 },
    color: { type: String, trim: true },
    description: { type: String, trim: true, maxlength: 2000 },
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    healthStatus: { type: String, trim: true, default: "Healthy" },
    vaccinationStatus: { type: String, trim: true, default: "Up to date" },
    temperament: [{ type: String, trim: true }],
    specialNeeds: { type: String, trim: true },
    adoptionStatus: { type: String, enum: ADOPTION_STATUSES, default: "available" },
    careNotes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

shelterPetSchema.index({ shelter: 1 });
shelterPetSchema.index({ adoptionStatus: 1 });
shelterPetSchema.index({ species: 1, breed: 1 });

module.exports = mongoose.model("ShelterPet", shelterPetSchema);
module.exports.ADOPTION_STATUSES = ADOPTION_STATUSES;
module.exports.SPECIES = SPECIES;
