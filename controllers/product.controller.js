const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const slugify = require("../utils/slugify");
const { uploadBufferToCloudinary } = require("../config/cloudinary.config");
const Product = require("../models/Product");

// GET /api/products — public browsing with filters
const listProducts = asyncHandler(async (req, res) => {
  const {
    category, minPrice, maxPrice, brand, minRating, search, featured,
    sort = "-createdAt", page = 1, limit = 12,
  } = req.query;

  const filter = { isActive: true };
  if (category) filter.category = category;
  if (brand) filter.brand = new RegExp(brand, "i");
  if (minRating) filter.rating = { $gte: Number(minRating) };
  if (featured) filter.featured = featured === "true";
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(Number(limit)).populate("category", "name slug"),
    Product.countDocuments(filter),
  ]);

  sendSuccess(res, 200, "Products retrieved successfully", {
    products,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

// GET /api/products/:slug — public detail (by slug for clean URLs)
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate("category", "name slug");
  if (!product) throw new ApiError(404, "Product not found");
  sendSuccess(res, 200, "Product retrieved successfully", { product });
});

// POST /api/products — admin
const createProduct = asyncHandler(async (req, res) => {
  const { name } = req.body;
  let slug = slugify(name);

  const existing = await Product.findOne({ slug });
  if (existing) slug = `${slug}-${Date.now().toString().slice(-5)}`;

  const product = await Product.create({ ...req.body, slug });
  sendSuccess(res, 201, "Product created successfully", { product });
});

// PATCH /api/products/:id — admin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");

  const allowedFields = [
    "name", "category", "description", "price", "compareAtPrice", "stock",
    "sku", "brand", "tags", "isActive", "featured",
  ];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  });
  if (req.body.name) product.slug = slugify(req.body.name);
  await product.save();

  sendSuccess(res, 200, "Product updated successfully", { product });
});

// DELETE /api/products/:id — admin (soft delete)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  product.isActive = false;
  await product.save();
  sendSuccess(res, 200, "Product deactivated successfully", {});
});

// POST /api/products/:id/images — admin
const addProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  if (!req.file) throw new ApiError(400, "No image file provided");

  const result = await uploadBufferToCloudinary(req.file.buffer, "vetaguard/products");
  product.images.push({ url: result.secure_url, publicId: result.public_id });
  await product.save();

  sendSuccess(res, 200, "Image added successfully", { product });
});

module.exports = {
  listProducts, getProductBySlug, createProduct, updateProduct, deleteProduct, addProductImage,
};
