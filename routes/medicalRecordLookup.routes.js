const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { getMedicalRecordById } = require("../controllers/medicalRecord.controller");

const router = express.Router();
router.get("/:id", protect, getMedicalRecordById);
module.exports = router;
