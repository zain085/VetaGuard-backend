const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { assertPetAccess } = require("../utils/ownership");
const { uploadBufferToCloudinary } = require("../config/cloudinary.config");
const Pet = require("../models/Pet");
const MedicalRecord = require("../models/MedicalRecord");

// POST /api/pets/:petId/medical-records  (vet-authored; admin can also add)
const createMedicalRecord = asyncHandler(async (req, res) => {
  const pet = await Pet.findById(req.params.petId);
  assertPetAccess(pet, req.user, { allowVet: true });

  if (req.user.role !== "vet" && req.user.role !== "admin") {
    throw new ApiError(403, "Only a veterinarian can add a medical record");
  }

  const record = await MedicalRecord.create({
    ...req.body,
    pet: pet._id,
    veterinarian: req.user.role === "vet" ? req.user._id : req.body.veterinarian,
  });

  sendSuccess(res, 201, "Medical record created successfully", { record });
});

// GET /api/pets/:petId/medical-records
const getMedicalRecords = asyncHandler(async (req, res) => {
  const pet = await Pet.findById(req.params.petId);
  assertPetAccess(pet, req.user, { allowVet: true });

  const { recordType, page = 1, limit = 20 } = req.query;
  const filter = { pet: pet._id };
  if (recordType) filter.recordType = recordType;

  const skip = (Number(page) - 1) * Number(limit);
  const [records, total] = await Promise.all([
    MedicalRecord.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("veterinarian", "name"),
    MedicalRecord.countDocuments(filter),
  ]);

  sendSuccess(res, 200, "Medical records retrieved successfully", {
    records,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

// GET /api/medical-records/:id
const getMedicalRecordById = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id).populate("pet").populate("veterinarian", "name");
  if (!record) throw new ApiError(404, "Medical record not found");
  assertPetAccess(record.pet, req.user, { allowVet: true });
  sendSuccess(res, 200, "Medical record retrieved successfully", { record });
});

// PATCH /api/medical-records/:id  (author vet or admin only)
const updateMedicalRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id).populate("pet");
  if (!record) throw new ApiError(404, "Medical record not found");

  const isAuthor = record.veterinarian?.toString() === req.user._id.toString();
  if (!isAuthor && req.user.role !== "admin") {
    throw new ApiError(403, "Only the authoring veterinarian or an admin can edit this record");
  }

  const allowedFields = [
    "diagnosis", "symptoms", "observations", "treatment",
    "medications", "prescriptions", "labResults", "followUpDate", "notes",
  ];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) record[field] = req.body[field];
  });
  await record.save();

  sendSuccess(res, 200, "Medical record updated successfully", { record });
});

// POST /api/medical-records/:id/attachments
const addAttachment = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id).populate("pet");
  if (!record) throw new ApiError(404, "Medical record not found");
  assertPetAccess(record.pet, req.user, { allowVet: true });

  if (!req.file) throw new ApiError(400, "No file provided");

  const result = await uploadBufferToCloudinary(req.file.buffer, "vetaguard/medical-records");
  record.attachments.push({
    url: result.secure_url,
    publicId: result.public_id,
    fileName: req.file.originalname,
  });
  await record.save();

  sendSuccess(res, 200, "Attachment added successfully", { record });
});

module.exports = {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  addAttachment,
};
