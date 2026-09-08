const express = require("express");
const { authorize } = require("../middleware/role.middleware");
const validate = require("../middleware/validation.middleware");
const upload = require("../middleware/upload.middleware");
const { createMedicalRecordValidator } = require("../validators/medicalRecord.validator");
const {
  createMedicalRecord, getMedicalRecords, updateMedicalRecord, addAttachment,
} = require("../controllers/medicalRecord.controller");

const router = express.Router({ mergeParams: true });

router.post("/", authorize("vet", "admin"), createMedicalRecordValidator, validate, createMedicalRecord);
router.get("/", getMedicalRecords);
router.patch("/:id", authorize("vet", "admin"), updateMedicalRecord);
router.post("/:id/attachments", upload.single("file"), addAttachment);

module.exports = router;
