const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { assertPetAccess } = require("../utils/ownership");
const { uploadBufferToCloudinary } = require("../config/cloudinary.config");
const Pet = require("../models/Pet");
const Vaccination = require("../models/Vaccination");

// POST /api/pets/:petId/vaccinations  (vet or admin creates; owner may log too)
const createVaccination = asyncHandler(async (req, res) => {
  const pet = await Pet.findById(req.params.petId);
  assertPetAccess(pet, req.user, { allowVet: true });

  const vaccination = await Vaccination.create({
    ...req.body,
    pet: pet._id,
    veterinarian: req.user.role === "vet" ? req.user._id : req.body.veterinarian,
  });

  sendSuccess(res, 201, "Vaccination recorded successfully", { vaccination });
});

// GET /api/pets/:petId/vaccinations
const getVaccinations = asyncHandler(async (req, res) => {
  const pet = await Pet.findById(req.params.petId);
  assertPetAccess(pet, req.user, { allowVet: true });

  const vaccinations = await Vaccination.find({ pet: pet._id })
    .sort({ dateAdministered: -1 })
    .populate("veterinarian", "name");

  sendSuccess(res, 200, "Vaccinations retrieved successfully", { vaccinations });
});

// PATCH /api/vaccinations/:id
const updateVaccination = asyncHandler(async (req, res) => {
  const vaccination = await Vaccination.findById(req.params.id).populate("pet");
  if (!vaccination) throw new ApiError(404, "Vaccination record not found");
  assertPetAccess(vaccination.pet, req.user, { allowVet: true });

  const allowedFields = ["vaccineName", "dateAdministered", "nextDueDate", "notes", "status"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) vaccination[field] = req.body[field];
  });
  await vaccination.save();

  sendSuccess(res, 200, "Vaccination updated successfully", { vaccination });
});

// DELETE /api/vaccinations/:id
const deleteVaccination = asyncHandler(async (req, res) => {
  const vaccination = await Vaccination.findById(req.params.id).populate("pet");
  if (!vaccination) throw new ApiError(404, "Vaccination record not found");
  assertPetAccess(vaccination.pet, req.user, { allowVet: true });
  await vaccination.deleteOne();
  sendSuccess(res, 200, "Vaccination deleted successfully", {});
});

// POST /api/vaccinations/:id/certificate
const uploadCertificate = asyncHandler(async (req, res) => {
  const vaccination = await Vaccination.findById(req.params.id).populate("pet");
  if (!vaccination) throw new ApiError(404, "Vaccination record not found");
  assertPetAccess(vaccination.pet, req.user, { allowVet: true });

  if (!req.file) throw new ApiError(400, "No certificate file provided");

  const result = await uploadBufferToCloudinary(req.file.buffer, "vetaguard/medical-records");
  vaccination.certificate = { url: result.secure_url, publicId: result.public_id };
  await vaccination.save();

  sendSuccess(res, 200, "Certificate uploaded successfully", { vaccination });
});

module.exports = {
  createVaccination,
  getVaccinations,
  updateVaccination,
  deleteVaccination,
  uploadCertificate,
};
