const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const slugify = require("../utils/slugify");
const { uploadBufferToCloudinary } = require("../config/cloudinary.config");
const CareArticle = require("../models/CareArticle");

// GET /api/articles — public, published only
const listArticles = asyncHandler(async (req, res) => {
  const { category, tag, search, page = 1, limit = 9 } = req.query;

  const filter = { published: true };
  if (category) filter.category = category;
  if (tag) filter.tags = tag;
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);
  const [articles, total] = await Promise.all([
    CareArticle.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate("author", "name"),
    CareArticle.countDocuments(filter),
  ]);

  sendSuccess(res, 200, "Articles retrieved successfully", {
    articles,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

// GET /api/articles/:slug — public
const getArticleBySlug = asyncHandler(async (req, res) => {
  const article = await CareArticle.findOne({ slug: req.params.slug, published: true }).populate("author", "name");
  if (!article) throw new ApiError(404, "Article not found");
  sendSuccess(res, 200, "Article retrieved successfully", { article });
});

// POST /api/articles — admin
const createArticle = asyncHandler(async (req, res) => {
  const { title } = req.body;
  let slug = slugify(title);
  const existing = await CareArticle.findOne({ slug });
  if (existing) slug = `${slug}-${Date.now().toString().slice(-5)}`;

  const article = await CareArticle.create({ ...req.body, slug, author: req.user._id });
  sendSuccess(res, 201, "Article created successfully", { article });
});

// PATCH /api/articles/:id — admin
const updateArticle = asyncHandler(async (req, res) => {
  const article = await CareArticle.findById(req.params.id);
  if (!article) throw new ApiError(404, "Article not found");

  const allowedFields = ["title", "excerpt", "content", "category", "tags", "readTime", "published"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) article[field] = req.body[field];
  });
  if (req.body.title) article.slug = slugify(req.body.title);
  await article.save();

  sendSuccess(res, 200, "Article updated successfully", { article });
});

// DELETE /api/articles/:id — admin (unpublish)
const deleteArticle = asyncHandler(async (req, res) => {
  const article = await CareArticle.findById(req.params.id);
  if (!article) throw new ApiError(404, "Article not found");
  article.published = false;
  await article.save();
  sendSuccess(res, 200, "Article unpublished successfully", {});
});

// POST /api/articles/:id/cover — admin
const uploadArticleCover = asyncHandler(async (req, res) => {
  const article = await CareArticle.findById(req.params.id);
  if (!article) throw new ApiError(404, "Article not found");
  if (!req.file) throw new ApiError(400, "No image file provided");

  const result = await uploadBufferToCloudinary(req.file.buffer, "vetaguard/articles");
  article.coverImage = { url: result.secure_url, publicId: result.public_id };
  await article.save();

  sendSuccess(res, 200, "Cover image uploaded successfully", { article });
});

module.exports = {
  listArticles, getArticleBySlug, createArticle, updateArticle, deleteArticle, uploadArticleCover,
};
