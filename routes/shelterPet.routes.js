const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const validate = require("../middleware/validation.middleware");
const upload = require("../middleware/upload.middleware");
const {
  createShelterPetValidator, updateAdoptionStatusValidator,
} = require("../validators/shelterPet.validator");
const {
  listShelterPets, getShelterPetById, getMyShelterPets, createShelterPet,
  updateShelterPet, updateAdoptionStatus, addShelterPetImage, deleteShelterPet,
} = require("../controllers/shelterPet.controller");

const router = express.Router();

router.get("/", listShelterPets);
router.get("/mine", protect, authorize("shelter"), getMyShelterPets);
router.post("/", protect, authorize("shelter"), createShelterPetValidator, validate, createShelterPet);
router.get("/:id", getShelterPetById);
router.patch("/:id", protect, authorize("shelter"), updateShelterPet);
router.patch("/:id/status", protect, authorize("shelter"), updateAdoptionStatusValidator, validate, updateAdoptionStatus);
router.post("/:id/images", protect, authorize("shelter"), upload.single("image"), addShelterPetImage);
router.delete("/:id", protect, authorize("shelter"), deleteShelterPet);

module.exports = router;
