const mongoose = require("mongoose");

const RECORD_TYPES = [
  "Vaccination",
  "Consultation",
  "Treatment",
  "Diagnosis",
  "Surgery",
  "Lab Report",
  "Prescription",
  "General Note",
];

const medicalRecordSchema = new mongoose.Schema(
  {
    pet: { type: mongoose.Schema.Types.ObjectId, ref: "Pet", required: true },
    veterinarian: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    recordType: { type: String, enum: RECORD_TYPES, required: true },
    diagnosis: { type: String, trim: true },
    symptoms: [{ type: String, trim: true }],
    observations: { type: String, trim: true, maxlength: 2000 },
    treatment: { type: String, trim: true, maxlength: 2000 },
    medications: [{ type: String, trim: true }],
    prescriptions: { type: String, trim: true, maxlength: 2000 },
    labResults: { type: String, trim: true, maxlength: 2000 },
    followUpDate: { type: Date },
    notes: { type: String, trim: true, maxlength: 2000 },
    attachments: [
      {
        url: String,
        publicId: String,
        fileName: String,
      },
    ],
  },
  { timestamps: true }
);

medicalRecordSchema.index({ pet: 1, createdAt: -1 });
medicalRecordSchema.index({ recordType: 1 });

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
module.exports.RECORD_TYPES = RECORD_TYPES;
