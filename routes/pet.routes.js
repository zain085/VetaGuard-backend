const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const validate = require("../middleware/validation.middleware");
const upload = require("../middleware/upload.middleware");
const { createPetValidator, updatePetValidator } = require("../validators/pet.validator");
const {
  createPet, getPets, getPetById, updatePet, deletePet,
  uploadPetImage, addGalleryImage, getPetTimeline,
} = require("../controllers/pet.controller");

const vaccinationRoutes = require("./vaccination.routes");
const medicalRecordRoutes = require("./medicalRecord.routes");

const router = express.Router();

router.use(protect);

router.post("/", authorize("owner", "admin"), createPetValidator, validate, createPet);
router.get("/", getPets);
router.get("/:id", getPetById);
router.patch("/:id", updatePetValidator, validate, updatePet);
router.delete("/:id", deletePet);
router.post("/:id/image", upload.single("image"), uploadPetImage);
router.post("/:id/gallery", upload.single("image"), addGalleryImage);
router.get("/:id/timeline", getPetTimeline);

// Nested resources: /api/pets/:petId/vaccinations, /api/pets/:petId/medical-records
router.use("/:petId/vaccinations", vaccinationRoutes);
router.use("/:petId/medical-records", medicalRecordRoutes);

module.exports = router;
