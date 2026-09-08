const mongoose = require("mongoose");

const vaccinationSchema = new mongoose.Schema(
  {
    pet: { type: mongoose.Schema.Types.ObjectId, ref: "Pet", required: true },
    veterinarian: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    vaccineName: { type: String, required: [true, "Vaccine name is required"], trim: true },
    dateAdministered: { type: Date, required: true },
    nextDueDate: { type: Date },
    notes: { type: String, trim: true, maxlength: 1000 },
    certificate: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["completed", "due", "overdue"],
      default: "completed",
    },
  },
  { timestamps: true }
);

vaccinationSchema.index({ pet: 1, dateAdministered: -1 });

module.exports = mongoose.model("Vaccination", vaccinationSchema);
