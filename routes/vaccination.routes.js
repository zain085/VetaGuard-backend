const express = require("express");
const { authorize } = require("../middleware/role.middleware");
const validate = require("../middleware/validation.middleware");
const upload = require("../middleware/upload.middleware");
const { createVaccinationValidator } = require("../validators/vaccination.validator");
const {
  createVaccination, getVaccinations, updateVaccination, deleteVaccination, uploadCertificate,
} = require("../controllers/vaccination.controller");

// mergeParams so :petId from the parent /api/pets router is available here
const router = express.Router({ mergeParams: true });

router.post("/", authorize("owner", "vet", "admin"), createVaccinationValidator, validate, createVaccination);
router.get("/", getVaccinations);
router.patch("/:id", authorize("owner", "vet", "admin"), updateVaccination);
router.delete("/:id", authorize("owner", "vet", "admin"), deleteVaccination);
router.post("/:id/certificate", authorize("owner", "vet", "admin"), upload.single("certificate"), uploadCertificate);

module.exports = router;
