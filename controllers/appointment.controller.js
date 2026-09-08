const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const Appointment = require("../models/Appointment");
const Pet = require("../models/Pet");
const VetProfile = require("../models/VetProfile");
const { getAvailableSlots } = require("../services/availability.service");
const { notify } = require("../services/notification.service");

// POST /api/appointments  (owner books)
const createAppointment = asyncHandler(async (req, res) => {
  const { veterinarian, pet: petId, date, time, reason, symptoms } = req.body;

  const pet = await Pet.findById(petId);
  if (!pet) throw new ApiError(404, "Pet not found");
  if (pet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only book appointments for your own pets");
  }

  const parsedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsedDate < today) {
    throw new ApiError(400, "Cannot book an appointment in the past");
  }

  const vetProfile = await VetProfile.findOne({ user: veterinarian, isActive: true });
  if (!vetProfile) throw new ApiError(404, "Veterinarian not found or unavailable");

  const openSlots = await getAvailableSlots(veterinarian, vetProfile, parsedDate);
  if (!openSlots.includes(time)) {
    throw new ApiError(409, "That time slot is no longer available — please choose another");
  }

  let appointment;
  try {
    appointment = await Appointment.create({
      owner: req.user._id,
      pet: petId,
      veterinarian,
      date: parsedDate,
      time,
      reason,
      symptoms,
      status: "pending",
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, "That time slot was just booked by someone else — please choose another");
    }
    throw err;
  }

  notify({
    user: veterinarian,
    type: "appointment_requested",
    title: "New appointment request",
    message: `You have a new appointment request for ${date} at ${time}.`,
    relatedEntity: "Appointment",
    relatedEntityId: appointment._id,
  });

  sendSuccess(res, 201, "Appointment requested successfully", { appointment });
});

// GET /api/appointments  (scoped by role)
const getAppointments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (req.user.role === "owner") filter.owner = req.user._id;
  else if (req.user.role === "vet") filter.veterinarian = req.user._id;
  // admin: no owner/vet filter — sees all

  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("pet", "name species breed")
      .populate("owner", "name email phone")
      .populate("veterinarian", "name email"),
    Appointment.countDocuments(filter),
  ]);

  sendSuccess(res, 200, "Appointments retrieved successfully", {
    appointments,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

// GET /api/appointments/:id
const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate("pet")
    .populate("owner", "name email phone")
    .populate("veterinarian", "name email");
  if (!appointment) throw new ApiError(404, "Appointment not found");

  assertAppointmentAccess(appointment, req.user);
  sendSuccess(res, 200, "Appointment retrieved successfully", { appointment });
});

function assertAppointmentAccess(appointment, user) {
  const isOwner = appointment.owner._id
    ? appointment.owner._id.toString() === user._id.toString()
    : appointment.owner.toString() === user._id.toString();
  const isVet = appointment.veterinarian._id
    ? appointment.veterinarian._id.toString() === user._id.toString()
    : appointment.veterinarian.toString() === user._id.toString();
  if (!isOwner && !isVet && user.role !== "admin") {
    throw new ApiError(403, "You do not have access to this appointment");
  }
}

// PATCH /api/appointments/:id/status  (vet: confirm/reject/reschedule/complete; owner: cancel handled separately)
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status, date, time, treatmentSummary, cancellationReason } = req.body;

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new ApiError(404, "Appointment not found");

  const isVet = appointment.veterinarian.toString() === req.user._id.toString();
  if (!isVet && req.user.role !== "admin") {
    throw new ApiError(403, "Only the assigned veterinarian can update this appointment's status");
  }

  if (["completed", "cancelled", "rejected"].includes(appointment.status)) {
    throw new ApiError(400, `This appointment is already ${appointment.status} and cannot be changed`);
  }

  if (status === "rescheduled") {
    if (!date || !time) throw new ApiError(400, "A new date and time are required to reschedule");
    appointment.date = new Date(date);
    appointment.time = time;
  }

  if (status === "completed" && treatmentSummary) {
    appointment.treatmentSummary = treatmentSummary;
  }

  if (["cancelled", "rejected"].includes(status) && cancellationReason) {
    appointment.cancellationReason = cancellationReason;
  }

  appointment.status = status;

  try {
    await appointment.save();
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, "That new time slot is already booked — please choose another");
    }
    throw err;
  }

  const statusMessages = {
    confirmed: "Your appointment has been confirmed by the veterinarian.",
    rescheduled: "Your appointment has been rescheduled — check the new date and time.",
    completed: "Your appointment has been marked completed.",
    rejected: "Your appointment request was declined by the veterinarian.",
  };
  if (statusMessages[status]) {
    notify({
      user: appointment.owner,
      type: `appointment_${status}`,
      title: "Appointment update",
      message: statusMessages[status],
      relatedEntity: "Appointment",
      relatedEntityId: appointment._id,
    });
  }

  sendSuccess(res, 200, "Appointment updated successfully", { appointment });
});

// PATCH /api/appointments/:id/cancel  (owner cancels their own pending/confirmed appointment)
const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new ApiError(404, "Appointment not found");

  const isOwner = appointment.owner.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    throw new ApiError(403, "You can only cancel your own appointments");
  }

  if (["completed", "cancelled", "rejected"].includes(appointment.status)) {
    throw new ApiError(400, `This appointment is already ${appointment.status}`);
  }

  appointment.status = "cancelled";
  appointment.cancellationReason = req.body.cancellationReason || "Cancelled by pet owner";
  await appointment.save();

  notify({
    user: appointment.veterinarian,
    type: "appointment_cancelled",
    title: "Appointment cancelled",
    message: "A pet owner cancelled their appointment with you.",
    relatedEntity: "Appointment",
    relatedEntityId: appointment._id,
  });

  sendSuccess(res, 200, "Appointment cancelled successfully", { appointment });
});

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
};
