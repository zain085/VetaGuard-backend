const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const validate = require("../middleware/validation.middleware");
const upload = require("../middleware/upload.middleware");
const { createCategoryValidator } = require("../validators/product.validator");
const {
  listCategories, getCategoryById, createCategory, updateCategory, deleteCategory, uploadCategoryImage,
} = require("../controllers/category.controller");

const router = express.Router();

router.get("/", listCategories);
router.get("/:id", getCategoryById);
router.post("/", protect, authorize("admin"), createCategoryValidator, validate, createCategory);
router.patch("/:id", protect, authorize("admin"), updateCategory);
router.delete("/:id", protect, authorize("admin"), deleteCategory);
router.post("/:id/image", protect, authorize("admin"), upload.single("image"), uploadCategoryImage);

module.exports = router;
