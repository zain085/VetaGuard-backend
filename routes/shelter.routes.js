const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const validate = require("../middleware/validation.middleware");
const upload = require("../middleware/upload.middleware");
const { upsertShelterValidator } = require("../validators/shelter.validator");
const {
  listShelters, getShelterById, getMyShelter, upsertMyShelter, uploadLogo, uploadCover,
} = require("../controllers/shelter.controller");

const router = express.Router();

router.get("/", listShelters);
router.get("/me", protect, authorize("shelter"), getMyShelter);
router.put("/me", protect, authorize("shelter"), upsertShelterValidator, validate, upsertMyShelter);
router.post("/me/logo", protect, authorize("shelter"), upload.single("image"), uploadLogo);
router.post("/me/cover", protect, authorize("shelter"), upload.single("image"), uploadCover);
router.get("/:id", getShelterById);

module.exports = router;
