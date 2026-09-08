const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const slugify = require("../utils/slugify");
const { uploadBufferToCloudinary } = require("../config/cloudinary.config");
const ProductCategory = require("../models/ProductCategory");

// GET /api/categories — public
const listCategories = asyncHandler(async (req, res) => {
  const categories = await ProductCategory.find({ isActive: true }).sort({ name: 1 });
  sendSuccess(res, 200, "Categories retrieved successfully", { categories });
});

// GET /api/categories/:id
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await ProductCategory.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");
  sendSuccess(res, 200, "Category retrieved successfully", { category });
});

// POST /api/categories — admin
const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const slug = slugify(name);

  const existing = await ProductCategory.findOne({ slug });
  if (existing) throw new ApiError(409, "A category with this name already exists");

  const category = await ProductCategory.create({ name, slug, description });
  sendSuccess(res, 201, "Category created successfully", { category });
});

// PATCH /api/categories/:id — admin
const updateCategory = asyncHandler(async (req, res) => {
  const category = await ProductCategory.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");

  const allowedFields = ["name", "description", "isActive"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) category[field] = req.body[field];
  });
  if (req.body.name) category.slug = slugify(req.body.name);
  await category.save();

  sendSuccess(res, 200, "Category updated successfully", { category });
});

// DELETE /api/categories/:id — admin (soft delete)
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await ProductCategory.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");
  category.isActive = false;
  await category.save();
  sendSuccess(res, 200, "Category deactivated successfully", {});
});

// POST /api/categories/:id/image — admin
const uploadCategoryImage = asyncHandler(async (req, res) => {
  const category = await ProductCategory.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");
  if (!req.file) throw new ApiError(400, "No image file provided");

  const result = await uploadBufferToCloudinary(req.file.buffer, "vetaguard/products");
  category.image = { url: result.secure_url, publicId: result.public_id };
  await category.save();

  sendSuccess(res, 200, "Category image uploaded successfully", { category });
});

module.exports = {
  listCategories, getCategoryById, createCategory, updateCategory, deleteCategory, uploadCategoryImage,
};
