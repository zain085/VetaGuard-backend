const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const validate = require("../middleware/validation.middleware");
const {
  createApplicationValidator, updateApplicationStatusValidator,
} = require("../validators/adoption.validator");
const {
  createApplication, getMyApplications, getShelterApplications,
  updateApplicationStatus, withdrawApplication,
} = require("../controllers/adoption.controller");

const router = express.Router();

router.use(protect);

router.post("/", authorize("owner", "admin"), createApplicationValidator, validate, createApplication);
router.get("/mine", authorize("owner", "admin"), getMyApplications);
router.get("/shelter", authorize("shelter"), getShelterApplications);
router.patch("/:id/status", authorize("shelter"), updateApplicationStatusValidator, validate, updateApplicationStatus);
router.patch("/:id/withdraw", authorize("owner", "admin"), withdrawApplication);

module.exports = router;
