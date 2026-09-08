const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const User = require("../models/User");
const Pet = require("../models/Pet");
const VetProfile = require("../models/VetProfile");
const Shelter = require("../models/Shelter");
const ShelterPet = require("../models/ShelterPet");
const Appointment = require("../models/Appointment");
const AdoptionApplication = require("../models/AdoptionApplication");
const Product = require("../models/Product");
const ProductReview = require("../models/ProductReview");
const VetReview = require("../models/VetReview");

// GET /api/admin/dashboard
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers, owners, vets, shelters,
    totalPets, shelterAnimals, appointments, adoptionApplications,
    products, productReviews, vetReviews,
    roleBreakdown, appointmentStatusBreakdown, userGrowth,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: "owner" }),
    User.countDocuments({ role: "vet" }),
    User.countDocuments({ role: "shelter" }),
    Pet.countDocuments({}),
    ShelterPet.countDocuments({}),
    Appointment.countDocuments({}),
    AdoptionApplication.countDocuments({}),
    Product.countDocuments({}),
    ProductReview.countDocuments({}),
    VetReview.countDocuments({}),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    Appointment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    User.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]),
  ]);

  sendSuccess(res, 200, "Dashboard stats retrieved successfully", {
    totals: {
      users: totalUsers, owners, vets, shelters,
      pets: totalPets, shelterAnimals, appointments, adoptionApplications,
      products, reviews: productReviews + vetReviews,
    },
    charts: {
      roleBreakdown: roleBreakdown.map((r) => ({ role: r._id, count: r.count })),
      appointmentStatusBreakdown: appointmentStatusBreakdown.map((a) => ({ status: a._id, count: a.count })),
      userGrowth: userGrowth.map((u) => ({ month: u._id, count: u.count })),
    },
  });
});

// ---- Users ----

// GET /api/admin/users
const listUsers = asyncHandler(async (req, res) => {
  const { role, search, isActive, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (search) {
    filter.$or = [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  sendSuccess(res, 200, "Users retrieved successfully", {
    users,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

// PATCH /api/admin/users/:id/status
const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  if (user.role === "admin") throw new ApiError(400, "Cannot deactivate an admin account");

  user.isActive = isActive;
  await user.save();
  sendSuccess(res, 200, `User ${isActive ? "activated" : "deactivated"} successfully`, { user: user.toSafeObject() });
});

// DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  if (user.role === "admin") throw new ApiError(400, "Cannot delete an admin account");

  // Soft delete: deactivate rather than destroy, to preserve referential integrity
  // of pets, appointments, reviews, etc. that reference this user.
  user.isActive = false;
  await user.save();
  sendSuccess(res, 200, "User deactivated successfully", {});
});

// ---- Veterinarians ----

// GET /api/admin/vets
const listVetsForAdmin = asyncHandler(async (req, res) => {
  const vets = await VetProfile.find({}).sort({ createdAt: -1 }).populate("user", "name email isActive");
  sendSuccess(res, 200, "Veterinarians retrieved successfully", { vets });
});

// PATCH /api/admin/vets/:id/approve
const approveVet = asyncHandler(async (req, res) => {
  const vet = await VetProfile.findById(req.params.id);
  if (!vet) throw new ApiError(404, "Veterinarian profile not found");
  vet.isApproved = true;
  vet.isActive = true;
  await vet.save();
  sendSuccess(res, 200, "Veterinarian approved successfully", { vet });
});

// PATCH /api/admin/vets/:id/suspend
const suspendVet = asyncHandler(async (req, res) => {
  const vet = await VetProfile.findById(req.params.id);
  if (!vet) throw new ApiError(404, "Veterinarian profile not found");
  vet.isActive = false;
  await vet.save();
  sendSuccess(res, 200, "Veterinarian suspended successfully", { vet });
});

// ---- Shelters ----

// GET /api/admin/shelters
const listSheltersForAdmin = asyncHandler(async (req, res) => {
  const shelters = await Shelter.find({}).sort({ createdAt: -1 }).populate("user", "name email isActive");
  sendSuccess(res, 200, "Shelters retrieved successfully", { shelters });
});

// PATCH /api/admin/shelters/:id/approve
const approveShelter = asyncHandler(async (req, res) => {
  const shelter = await Shelter.findById(req.params.id);
  if (!shelter) throw new ApiError(404, "Shelter not found");
  shelter.verified = true;
  shelter.isActive = true;
  await shelter.save();
  sendSuccess(res, 200, "Shelter approved successfully", { shelter });
});

// PATCH /api/admin/shelters/:id/suspend
const suspendShelter = asyncHandler(async (req, res) => {
  const shelter = await Shelter.findById(req.params.id);
  if (!shelter) throw new ApiError(404, "Shelter not found");
  shelter.isActive = false;
  await shelter.save();
  sendSuccess(res, 200, "Shelter suspended successfully", { shelter });
});

// ---- Reviews ----

// GET /api/admin/reviews?type=product|vet
const listReviewsForAdmin = asyncHandler(async (req, res) => {
  const { type = "product" } = req.query;
  const Model = type === "vet" ? VetReview : ProductReview;
  const populateField = type === "vet" ? "veterinarian" : "product";

  const reviews = await Model.find({})
    .sort({ createdAt: -1 })
    .populate("user", "name email")
    .populate(populateField, type === "vet" ? "name" : "name slug");

  sendSuccess(res, 200, "Reviews retrieved successfully", { reviews, type });
});

// PATCH /api/admin/reviews/:id/moderate?type=product|vet
const moderateReview = asyncHandler(async (req, res) => {
  const { type = "product" } = req.query;
  const { isApproved } = req.body;
  const Model = type === "vet" ? VetReview : ProductReview;

  const review = await Model.findById(req.params.id);
  if (!review) throw new ApiError(404, "Review not found");
  review.isApproved = isApproved;
  await review.save();

  sendSuccess(res, 200, `Review ${isApproved ? "approved" : "hidden"} successfully`, { review });
});

// DELETE /api/admin/reviews/:id?type=product|vet
const deleteReview = asyncHandler(async (req, res) => {
  const { type = "product" } = req.query;
  const Model = type === "vet" ? VetReview : ProductReview;

  const review = await Model.findById(req.params.id);
  if (!review) throw new ApiError(404, "Review not found");
  await review.deleteOne();

  sendSuccess(res, 200, "Review deleted successfully", {});
});

module.exports = {
  getDashboardStats,
  listUsers, updateUserStatus, deleteUser,
  listVetsForAdmin, approveVet, suspendVet,
  listSheltersForAdmin, approveShelter, suspendShelter,
  listReviewsForAdmin, moderateReview, deleteReview,
};
