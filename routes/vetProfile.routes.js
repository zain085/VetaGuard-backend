const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const validate = require("../middleware/validation.middleware");
const upload = require("../middleware/upload.middleware");
const { upsertVetProfileValidator } = require("../validators/vetProfile.validator");
const {
  listVets, getVetById, getVetSlots, getMyProfile, upsertMyProfile, uploadMyVetImage,
} = require("../controllers/vetProfile.controller");

const router = express.Router();

// Public discovery — no auth required
router.get("/", listVets);

// Vet's own profile management — must come before the public "/:id" route
router.get("/me", protect, authorize("vet"), getMyProfile);
router.put("/me", protect, authorize("vet"), upsertVetProfileValidator, validate, upsertMyProfile);
router.post("/me/image", protect, authorize("vet"), upload.single("image"), uploadMyVetImage);

router.get("/:id", getVetById);
router.get("/:id/slots", getVetSlots);

module.exports = router;
