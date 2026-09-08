const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { uploadBufferToCloudinary } = require("../config/cloudinary.config");
const Shelter = require("../models/Shelter");
const ShelterPet = require("../models/ShelterPet");

async function getOwnedShelterOrThrow(userId) {
  const shelter = await Shelter.findOne({ user: userId });
  if (!shelter) throw new ApiError(404, "Create your shelter profile first");
  return shelter;
}

// GET /api/shelter-pets — public browsing with filters
const listShelterPets = asyncHandler(async (req, res) => {
  const { species, breed, gender, minAge, maxAge, city, adoptionStatus, page = 1, limit = 12 } = req.query;

  const filter = {};
  if (species) filter.species = species;
  if (breed) filter.breed = new RegExp(breed, "i");
  if (gender) filter.gender = gender;
  if (adoptionStatus) filter.adoptionStatus = adoptionStatus;
  else filter.adoptionStatus = { $ne: "unavailable" }; // hide unavailable by default for public browsing
  if (minAge || maxAge) {
    filter.age = {};
    if (minAge) filter.age.$gte = Number(minAge);
    if (maxAge) filter.age.$lte = Number(maxAge);
  }

  let shelterIds;
  if (city) {
    const shelters = await Shelter.find({ city: new RegExp(city, "i") }).select("_id");
    shelterIds = shelters.map((s) => s._id);
    filter.shelter = { $in: shelterIds };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [pets, total] = await Promise.all([
    ShelterPet.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("shelter", "shelterName city verified"),
    ShelterPet.countDocuments(filter),
  ]);

  sendSuccess(res, 200, "Adoptable pets retrieved successfully", {
    pets,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

// GET /api/shelter-pets/:id — public detail
const getShelterPetById = asyncHandler(async (req, res) => {
  const pet = await ShelterPet.findById(req.params.id).populate("shelter", "shelterName city phone verified");
  if (!pet) throw new ApiError(404, "Pet not found");
  sendSuccess(res, 200, "Pet retrieved successfully", { pet });
});

// GET /api/shelter-pets/mine — shelter's own listings (any status)
const getMyShelterPets = asyncHandler(async (req, res) => {
  const shelter = await getOwnedShelterOrThrow(req.user._id);
  const pets = await ShelterPet.find({ shelter: shelter._id }).sort({ createdAt: -1 });
  sendSuccess(res, 200, "Your listings retrieved successfully", { pets });
});

// POST /api/shelter-pets
const createShelterPet = asyncHandler(async (req, res) => {
  const shelter = await getOwnedShelterOrThrow(req.user._id);
  const pet = await ShelterPet.create({ ...req.body, shelter: shelter._id });
  sendSuccess(res, 201, "Pet listed successfully", { pet });
});

async function assertOwnsListing(petId, userId) {
  const pet = await ShelterPet.findById(petId).populate("shelter");
  if (!pet) throw new ApiError(404, "Pet not found");
  if (pet.shelter.user.toString() !== userId.toString()) {
    throw new ApiError(403, "You do not manage this listing");
  }
  return pet;
}

// PATCH /api/shelter-pets/:id
const updateShelterPet = asyncHandler(async (req, res) => {
  const pet = await assertOwnsListing(req.params.id, req.user._id);

  const allowedFields = [
    "name", "species", "breed", "gender", "age", "weight", "color", "description",
    "healthStatus", "vaccinationStatus", "temperament", "specialNeeds", "careNotes",
  ];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) pet[field] = req.body[field];
  });
  await pet.save();

  sendSuccess(res, 200, "Pet updated successfully", { pet });
});

// PATCH /api/shelter-pets/:id/status
const updateAdoptionStatus = asyncHandler(async (req, res) => {
  const pet = await assertOwnsListing(req.params.id, req.user._id);
  pet.adoptionStatus = req.body.adoptionStatus;
  await pet.save();
  sendSuccess(res, 200, "Adoption status updated successfully", { pet });
});

// POST /api/shelter-pets/:id/images
const addShelterPetImage = asyncHandler(async (req, res) => {
  const pet = await assertOwnsListing(req.params.id, req.user._id);
  if (!req.file) throw new ApiError(400, "No image file provided");

  const result = await uploadBufferToCloudinary(req.file.buffer, "vetaguard/adoptions");
  pet.images.push({ url: result.secure_url, publicId: result.public_id });
  await pet.save();

  sendSuccess(res, 200, "Image added successfully", { pet });
});

// DELETE /api/shelter-pets/:id — soft delete by marking unavailable
const deleteShelterPet = asyncHandler(async (req, res) => {
  const pet = await assertOwnsListing(req.params.id, req.user._id);
  pet.adoptionStatus = "unavailable";
  await pet.save();
  sendSuccess(res, 200, "Listing removed successfully", {});
});

module.exports = {
  listShelterPets,
  getShelterPetById,
  getMyShelterPets,
  createShelterPet,
  updateShelterPet,
  updateAdoptionStatus,
  addShelterPetImage,
  deleteShelterPet,
};
