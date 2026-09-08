const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Product name is required"], trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "ProductCategory", required: true },
    description: { type: String, trim: true, maxlength: 3000 },
    price: { type: Number, required: [true, "Price is required"], min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, trim: true },
    brand: { type: String, trim: true },
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    specifications: { type: Map, of: String },
    tags: [{ type: String, trim: true }],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// slug already has a unique index via the schema field option above
productSchema.index({ category: 1 });
productSchema.index({ name: "text", tags: "text" });

module.exports = mongoose.model("Product", productSchema);
