const mongoose = require("mongoose");

const petSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: [true, "Pet name is required"], trim: true },
    species: {
      type: String,
      enum: ["Dog", "Cat", "Bird", "Rabbit", "Other"],
      required: [true, "Species is required"],
    },
    breed: { type: String, trim: true },
    gender: { type: String, enum: ["Male", "Female", "Unknown"], default: "Unknown" },
    dateOfBirth: { type: Date },
    weight: { type: Number, min: 0 }, // kg
    color: { type: String, trim: true },
    microchipNumber: { type: String, trim: true },
    bloodType: { type: String, trim: true },
    description: { type: String, trim: true, maxlength: 1000 },
    profileImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    gallery: [
      {
        url: String,
        publicId: String,
      },
    ],
    allergies: [{ type: String, trim: true }],
    chronicConditions: [{ type: String, trim: true }],
    status: { type: String, enum: ["active", "deceased", "archived"], default: "active" },
  },
  { timestamps: true }
);

petSchema.index({ owner: 1 });
petSchema.index({ species: 1, breed: 1 });

petSchema.virtual("age").get(function computeAge() {
  if (!this.dateOfBirth) return null;
  const diffMs = Date.now() - this.dateOfBirth.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25)));
});
petSchema.set("toJSON", { virtuals: true });
petSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Pet", petSchema);
