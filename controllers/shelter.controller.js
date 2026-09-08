const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { uploadBufferToCloudinary } = require("../config/cloudinary.config");
const Shelter = require("../models/Shelter");

// GET /api/shelters — public directory
const listShelters = asyncHandler(async (req, res) => {
  const { city, search, page = 1, limit = 12 } = req.query;
  const filter = { isActive: true };
  if (city) filter.city = new RegExp(city, "i");
  if (search) filter.shelterName = new RegExp(search, "i");

  const skip = (Number(page) - 1) * Number(limit);
  const [shelters, total] = await Promise.all([
    Shelter.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Shelter.countDocuments(filter),
  ]);

  sendSuccess(res, 200, "Shelters retrieved successfully", {
    shelters,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

// GET /api/shelters/:id
const getShelterById = asyncHandler(async (req, res) => {
  const shelter = await Shelter.findById(req.params.id);
  if (!shelter) throw new ApiError(404, "Shelter not found");
  sendSuccess(res, 200, "Shelter retrieved successfully", { shelter });
});

// GET /api/shelters/me
const getMyShelter = asyncHandler(async (req, res) => {
  const shelter = await Shelter.findOne({ user: req.user._id });
  sendSuccess(res, 200, "Shelter profile retrieved successfully", { shelter });
});

// PUT /api/shelters/me
const upsertMyShelter = asyncHandler(async (req, res) => {
  const allowedFields = [
    "shelterName", "contactPerson", "phone", "address", "city",
    "description", "website", "socialLinks",
  ];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const shelter = await Shelter.findOneAndUpdate(
    { user: req.user._id },
    { $set: updates, $setOnInsert: { user: req.user._id } },
    { new: true, upsert: true, runValidators: true }
  );

  sendSuccess(res, 200, "Shelter profile saved successfully", { shelter });
});

// POST /api/shelters/me/logo | /api/shelters/me/cover
const uploadShelterImage = (field) =>
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "No image file provided");

    const shelter = await Shelter.findOne({ user: req.user._id });
    if (!shelter) throw new ApiError(404, "Create your shelter profile before uploading an image");

    const result = await uploadBufferToCloudinary(req.file.buffer, "vetaguard/shelters");
    shelter[field] = { url: result.secure_url, publicId: result.public_id };
    await shelter.save();

    sendSuccess(res, 200, "Image uploaded successfully", { shelter });
  });

module.exports = {
  listShelters,
  getShelterById,
  getMyShelter,
  upsertMyShelter,
  uploadLogo: uploadShelterImage("logo"),
  uploadCover: uploadShelterImage("coverImage"),
};
