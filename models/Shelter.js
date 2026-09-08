const mongoose = require("mongoose");

const shelterSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    shelterName: { type: String, required: [true, "Shelter name is required"], trim: true },
    contactPerson: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    description: { type: String, trim: true, maxlength: 2000 },
    logo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    coverImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    website: { type: String, trim: true },
    socialLinks: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      twitter: { type: String, trim: true },
    },
    verified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

shelterSchema.index({ city: 1 });

module.exports = mongoose.model("Shelter", shelterSchema);
