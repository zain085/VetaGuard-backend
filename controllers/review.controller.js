const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const Product = require("../models/Product");
const ProductReview = require("../models/ProductReview");
const VetProfile = require("../models/VetProfile");
const VetReview = require("../models/VetReview");
const Appointment = require("../models/Appointment");

async function recalculateRating(Model, matchField, matchValue, TargetModel, targetQuery) {
  const stats = await Model.aggregate([
    { $match: { [matchField]: matchValue, isApproved: true } },
    { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const { avgRating = 0, count = 0 } = stats[0] || {};
  await TargetModel.updateOne(
    targetQuery,
    { $set: { rating: Math.round(avgRating * 10) / 10, reviewCount: count } }
  );
}

// GET /api/reviews/product/:productId — public
const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await ProductReview.find({ product: req.params.productId, isApproved: true })
    .sort({ createdAt: -1 })
    .populate("user", "name");
  sendSuccess(res, 200, "Reviews retrieved successfully", { reviews });
});

// POST /api/reviews/product
const createProductReview = asyncHandler(async (req, res) => {
  const { product: productId, rating, comment } = req.body;

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  let review;
  try {
    review = await ProductReview.create({ user: req.user._id, product: productId, rating, comment });
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, "You have already reviewed this product");
    throw err;
  }

  await recalculateRating(ProductReview, "product", product._id, Product, { _id: product._id });
  sendSuccess(res, 201, "Review submitted successfully", { review });
});

// GET /api/reviews/vet/:vetUserId — public
const getVetReviews = asyncHandler(async (req, res) => {
  const reviews = await VetReview.find({ veterinarian: req.params.vetUserId, isApproved: true })
    .sort({ createdAt: -1 })
    .populate("user", "name");
  sendSuccess(res, 200, "Reviews retrieved successfully", { reviews });
});

// POST /api/reviews/vet  (owner must have at least one completed appointment with this vet)
const createVetReview = asyncHandler(async (req, res) => {
  const { veterinarian, rating, comment } = req.body;

  const hasCompletedVisit = await Appointment.findOne({
    owner: req.user._id,
    veterinarian,
    status: "completed",
  });
  if (!hasCompletedVisit) {
    throw new ApiError(403, "You can only review a veterinarian after a completed appointment");
  }

  let review;
  try {
    review = await VetReview.create({
      user: req.user._id,
      veterinarian,
      appointment: hasCompletedVisit._id,
      rating,
      comment,
    });
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, "You have already reviewed this veterinarian");
    throw err;
  }

  const vetProfile = await VetProfile.findOne({ user: veterinarian });
  if (vetProfile) {
    await recalculateRating(VetReview, "veterinarian", veterinarian, VetProfile, { user: veterinarian });
  }

  sendSuccess(res, 201, "Review submitted successfully", { review });
});

module.exports = { getProductReviews, createProductReview, getVetReviews, createVetReview };
