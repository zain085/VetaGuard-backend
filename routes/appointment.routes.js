const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const validate = require("../middleware/validation.middleware");
const {
  createAppointmentValidator, updateStatusValidator,
} = require("../validators/appointment.validator");
const {
  createAppointment, getAppointments, getAppointmentById,
  updateAppointmentStatus, cancelAppointment,
} = require("../controllers/appointment.controller");

const router = express.Router();

router.use(protect);

router.post("/", authorize("owner", "admin"), createAppointmentValidator, validate, createAppointment);
router.get("/", getAppointments);
router.get("/:id", getAppointmentById);
router.patch("/:id/status", authorize("vet", "admin"), updateStatusValidator, validate, updateAppointmentStatus);
router.patch("/:id/cancel", authorize("owner", "admin"), cancelAppointment);

module.exports = router;
