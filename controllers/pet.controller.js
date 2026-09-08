const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { assertPetAccess } = require("../utils/ownership");
const { uploadBufferToCloudinary } = require("../config/cloudinary.config");
const Pet = require("../models/Pet");
const Vaccination = require("../models/Vaccination");
const MedicalRecord = require("../models/MedicalRecord");

// POST /api/pets
const createPet = asyncHandler(async (req, res) => {
  const pet = await Pet.create({ ...req.body, owner: req.user._id });
  sendSuccess(res, 201, "Pet added successfully", { pet });
});

// GET /api/pets  (owner: their own pets; admin: all, with filters)
const getPets = asyncHandler(async (req, res) => {
  const { species, breed, gender, page = 1, limit = 12 } = req.query;

  const filter = req.user.role === "admin" ? {} : { owner: req.user._id };
  if (species) filter.species = species;
  if (breed) filter.breed = new RegExp(breed, "i");
  if (gender) filter.gender = gender;

  const skip = (Number(page) - 1) * Number(limit);
  const [pets, total] = await Promise.all([
    Pet.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Pet.countDocuments(filter),
  ]);

  sendSuccess(res, 200, "Pets retrieved successfully", {
    pets,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

// GET /api/pets/:id
const getPetById = asyncHandler(async (req, res) => {
  const pet = await Pet.findById(req.params.id);
  assertPetAccess(pet, req.user, { allowVet: true });
  sendSuccess(res, 200, "Pet retrieved successfully", { pet });
});

// PATCH /api/pets/:id
const updatePet = asyncHandler(async (req, res) => {
  const pet = await Pet.findById(req.params.id);
  assertPetAccess(pet, req.user);

  const allowedFields = [
    "name", "species", "breed", "gender", "dateOfBirth", "weight",
    "color", "microchipNumber", "bloodType", "description",
    "allergies", "chronicConditions", "status",
  ];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) pet[field] = req.body[field];
  });
  await pet.save();

  sendSuccess(res, 200, "Pet updated successfully", { pet });
});

// DELETE /api/pets/:id  (soft delete: archive, don't destroy medical history)
const deletePet = asyncHandler(async (req, res) => {
  const pet = await Pet.findById(req.params.id);
  assertPetAccess(pet, req.user);
  pet.status = "archived";
  await pet.save();
  sendSuccess(res, 200, "Pet archived successfully", {});
});

// POST /api/pets/:id/image  (profile image, multer memoryStorage -> Cloudinary)
const uploadPetImage = asyncHandler(async (req, res) => {
  const pet = await Pet.findById(req.params.id);
  assertPetAccess(pet, req.user);

  if (!req.file) throw new ApiError(400, "No image file provided");

  const result = await uploadBufferToCloudinary(req.file.buffer, "vetaguard/pets");
  pet.profileImage = { url: result.secure_url, publicId: result.public_id };
  await pet.save();

  sendSuccess(res, 200, "Pet image uploaded successfully", { pet });
});

// POST /api/pets/:id/gallery
const addGalleryImage = asyncHandler(async (req, res) => {
  const pet = await Pet.findById(req.params.id);
  assertPetAccess(pet, req.user);

  if (!req.file) throw new ApiError(400, "No image file provided");

  const result = await uploadBufferToCloudinary(req.file.buffer, "vetaguard/pets");
  pet.gallery.push({ url: result.secure_url, publicId: result.public_id });
  await pet.save();

  sendSuccess(res, 200, "Image added to gallery", { pet });
});

// GET /api/pets/:id/timeline — vaccinations + medical records, chronologically
const getPetTimeline = asyncHandler(async (req, res) => {
  const pet = await Pet.findById(req.params.id);
  assertPetAccess(pet, req.user, { allowVet: true });

  const [vaccinations, records] = await Promise.all([
    Vaccination.find({ pet: pet._id }).populate("veterinarian", "name"),
    MedicalRecord.find({ pet: pet._id }).populate("veterinarian", "name"),
  ]);

  const events = [
    ...vaccinations.map((v) => ({
      type: "vaccination",
      date: v.dateAdministered,
      title: `Vaccination: ${v.vaccineName}`,
      veterinarian: v.veterinarian?.name || null,
      detail: v.notes || null,
      nextDueDate: v.nextDueDate || null,
      refId: v._id,
    })),
    ...records.map((r) => ({
      type: "medicalRecord",
      date: r.createdAt,
      title: `${r.recordType}${r.diagnosis ? `: ${r.diagnosis}` : ""}`,
      veterinarian: r.veterinarian?.name || null,
      detail: r.observations || r.treatment || r.notes || null,
      followUpDate: r.followUpDate || null,
      refId: r._id,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  sendSuccess(res, 200, "Health timeline retrieved successfully", { events });
});

module.exports = {
  createPet,
  getPets,
  getPetById,
  updatePet,
  deletePet,
  uploadPetImage,
  addGalleryImage,
  getPetTimeline,
};
