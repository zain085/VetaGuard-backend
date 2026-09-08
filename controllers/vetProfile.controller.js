const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { uploadBufferToCloudinary } = require("../config/cloudinary.config");
const VetProfile = require("../models/VetProfile");
const User = require("../models/User");
const { getAvailableSlots } = require("../services/availability.service");

// GET /api/vets  — public discovery with search/filter/pagination
const listVets = asyncHandler(async (req, res) => {
  const { specialization, city, minExperience, minRating, search, page = 1, limit = 12 } = req.query;

  const filter = { isActive: true, isApproved: true };
  if (specialization) filter.specialization = new RegExp(specialization, "i");
  if (city) filter.city = new RegExp(city, "i");
  if (minExperience) filter.experience = { $gte: Number(minExperience) };
  if (minRating) filter.rating = { $gte: Number(minRating) };

  const skip = (Number(page) - 1) * Number(limit);

  let query = VetProfile.find(filter).populate("user", "name email avatar city");
  if (search) {
    // simple cross-field search on populated user name happens post-query since
    // Mongoose can't $regex a populated field directly without aggregation
  }

  const [profiles, total] = await Promise.all([
    query.sort({ rating: -1, reviewCount: -1 }).skip(skip).limit(Number(limit)),
    VetProfile.countDocuments(filter),
  ]);

  const filtered = search
    ? profiles.filter((p) => p.user?.name?.toLowerCase().includes(search.toLowerCase()))
    : profiles;

  sendSuccess(res, 200, "Veterinarians retrieved successfully", {
    vets: filtered,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

// GET /api/vets/:id — public profile detail (id is the VetProfile _id)
const getVetById = asyncHandler(async (req, res) => {
  const profile = await VetProfile.findById(req.params.id).populate("user", "name email avatar city phone");
  if (!profile) throw new ApiError(404, "Veterinarian profile not found");
  sendSuccess(res, 200, "Veterinarian retrieved successfully", { vet: profile });
});

// GET /api/vets/:id/slots?date=YYYY-MM-DD
const getVetSlots = asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!date) throw new ApiError(400, "A date query parameter is required");

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) throw new ApiError(400, "Invalid date");

  const profile = await VetProfile.findById(req.params.id);
  if (!profile) throw new ApiError(404, "Veterinarian profile not found");

  const slots = await getAvailableSlots(profile.user, profile, parsedDate);
  sendSuccess(res, 200, "Available slots retrieved successfully", { date, slots });
});

// GET /api/vets/me — the logged-in vet's own profile (may not exist yet)
const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await VetProfile.findOne({ user: req.user._id });
  sendSuccess(res, 200, "Profile retrieved successfully", { vet: profile });
});

// PUT /api/vets/me — create or update the logged-in vet's own profile
const upsertMyProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    "specialization", "qualification", "experience", "clinicName", "clinicAddress",
    "city", "bio", "consultationFee", "services", "availability", "latitude", "longitude",
  ];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const profile = await VetProfile.findOneAndUpdate(
    { user: req.user._id },
    { $set: updates, $setOnInsert: { user: req.user._id } },
    { new: true, upsert: true, runValidators: true }
  );

  sendSuccess(res, 200, "Profile saved successfully", { vet: profile });
});

// POST /api/vets/me/image
const uploadMyVetImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No image file provided");

  const profile = await VetProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, "Create your profile before uploading an image");

  const result = await uploadBufferToCloudinary(req.file.buffer, "vetaguard/users");
  profile.profileImage = { url: result.secure_url, publicId: result.public_id };
  await profile.save();

  sendSuccess(res, 200, "Profile image uploaded successfully", { vet: profile });
});

module.exports = { listVets, getVetById, getVetSlots, getMyProfile, upsertMyProfile, uploadMyVetImage };
