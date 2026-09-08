const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const validate = require("../middleware/validation.middleware");
const upload = require("../middleware/upload.middleware");
const { createArticleValidator } = require("../validators/careArticle.validator");
const {
  listArticles, getArticleBySlug, createArticle, updateArticle, deleteArticle, uploadArticleCover,
} = require("../controllers/careArticle.controller");

const router = express.Router();

router.get("/", listArticles);
router.post("/", protect, authorize("admin"), createArticleValidator, validate, createArticle);
router.get("/:slug", getArticleBySlug);
router.patch("/:id", protect, authorize("admin"), updateArticle);
router.delete("/:id", protect, authorize("admin"), deleteArticle);
router.post("/:id/cover", protect, authorize("admin"), upload.single("image"), uploadArticleCover);

module.exports = router;
