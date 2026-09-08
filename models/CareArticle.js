const mongoose = require("mongoose");

const CATEGORIES = [
  "Feeding", "Hygiene", "Exercise", "Vaccination", "Grooming", "Training",
  "General Health", "Emergency Care",
];

const careArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"], trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, trim: true, maxlength: 300 },
    content: { type: String, required: [true, "Content is required"] },
    category: { type: String, enum: CATEGORIES, required: true },
    coverImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    tags: [{ type: String, trim: true }],
    readTime: { type: Number, default: 3, min: 1 }, // minutes
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

careArticleSchema.index({ category: 1 });
careArticleSchema.index({ published: 1 });
careArticleSchema.index({ title: "text", tags: "text", excerpt: "text" });

module.exports = mongoose.model("CareArticle", careArticleSchema);
module.exports.CATEGORIES = CATEGORIES;
