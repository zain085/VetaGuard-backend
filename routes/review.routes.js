const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const validate = require("../middleware/validation.middleware");
const {
  createProductReviewValidator, createVetReviewValidator,
} = require("../validators/review.validator");
const {
  getProductReviews, createProductReview, getVetReviews, createVetReview,
} = require("../controllers/review.controller");

const router = express.Router();

router.get("/product/:productId", getProductReviews);
router.post("/product", protect, createProductReviewValidator, validate, createProductReview);
router.get("/vet/:vetUserId", getVetReviews);
router.post("/vet", protect, authorize("owner"), createVetReviewValidator, validate, createVetReview);

module.exports = router;
