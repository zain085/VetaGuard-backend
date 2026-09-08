const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const validate = require("../middleware/validation.middleware");
const upload = require("../middleware/upload.middleware");
const { createProductValidator } = require("../validators/product.validator");
const {
  listProducts, getProductBySlug, createProduct, updateProduct, deleteProduct, addProductImage,
} = require("../controllers/product.controller");

const router = express.Router();

router.get("/", listProducts);
router.post("/", protect, authorize("admin"), createProductValidator, validate, createProduct);
router.get("/:slug", getProductBySlug);
router.patch("/:id", protect, authorize("admin"), updateProduct);
router.delete("/:id", protect, authorize("admin"), deleteProduct);
router.post("/:id/images", protect, authorize("admin"), upload.single("image"), addProductImage);

module.exports = router;
