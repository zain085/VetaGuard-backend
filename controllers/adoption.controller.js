const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const ShelterPet = require("../models/ShelterPet");
const Shelter = require("../models/Shelter");
const AdoptionApplication = require("../models/AdoptionApplication");
const { notify } = require("../services/notification.service");

// POST /api/adoptions  (owner applies)
const createApplication = asyncHandler(async (req, res) => {
  const { shelterPet: shelterPetId } = req.body;

  const shelterPet = await ShelterPet.findById(shelterPetId);
  if (!shelterPet) throw new ApiError(404, "Pet not found");
  if (shelterPet.adoptionStatus === "adopted") {
    throw new ApiError(400, "This pet has already been adopted");
  }
  if (shelterPet.adoptionStatus === "unavailable") {
    throw new ApiError(400, "This pet is no longer available for adoption");
  }

  let application;
  try {
    application = await AdoptionApplication.create({
      ...req.body,
      shelterPet: shelterPetId,
      shelter: shelterPet.shelter,
      applicant: req.user._id,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, "You already have an active application for this pet");
    }
    throw err;
  }

  // Reflect that an application has come in — shelter still reviews before reserving
  if (shelterPet.adoptionStatus === "available") {
    shelterPet.adoptionStatus = "application_pending";
    await shelterPet.save();
  }

  const shelter = await Shelter.findById(shelterPet.shelter);
  if (shelter) {
    notify({
      user: shelter.user,
      type: "adoption_application_received",
      title: "New adoption application",
      message: `You received a new application for ${shelterPet.name}.`,
      relatedEntity: "AdoptionApplication",
      relatedEntityId: application._id,
    });
  }

  sendSuccess(res, 201, "Adoption application submitted successfully", { application });
});

// GET /api/adoptions/mine — the logged-in owner's applications
const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await AdoptionApplication.find({ applicant: req.user._id })
    .sort({ createdAt: -1 })
    .populate("shelterPet", "name species breed images")
    .populate("shelter", "shelterName city");

  sendSuccess(res, 200, "Your applications retrieved successfully", { applications });
});

// GET /api/adoptions/shelter — applications for the logged-in shelter's listings
const getShelterApplications = asyncHandler(async (req, res) => {
  const shelter = await Shelter.findOne({ user: req.user._id });
  if (!shelter) throw new ApiError(404, "Create your shelter profile first");

  const { status } = req.query;
  const filter = { shelter: shelter._id };
  if (status) filter.status = status;

  const applications = await AdoptionApplication.find(filter)
    .sort({ createdAt: -1 })
    .populate("shelterPet", "name species breed images")
    .populate("applicant", "name email phone");

  sendSuccess(res, 200, "Applications retrieved successfully", { applications });
});

// PATCH /api/adoptions/:id/status  (shelter reviews)
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, shelterNotes } = req.body;

  const application = await AdoptionApplication.findById(req.params.id).populate("shelter");
  if (!application) throw new ApiError(404, "Application not found");

  if (application.shelter.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You do not manage this application");
  }
  if (["withdrawn", "completed"].includes(application.status)) {
    throw new ApiError(400, `This application is already ${application.status}`);
  }

  application.status = status;
  if (shelterNotes !== undefined) application.shelterNotes = shelterNotes;
  application.reviewedAt = new Date();
  await application.save();

  // Keep the pet listing's status in sync with the application decision
  const pet = await ShelterPet.findById(application.shelterPet);
  if (pet) {
    if (status === "approved") pet.adoptionStatus = "reserved";
    if (status === "completed") pet.adoptionStatus = "adopted";
    if (status === "rejected" && pet.adoptionStatus === "application_pending") {
      pet.adoptionStatus = "available";
    }
    await pet.save();
  }

  const statusMessages = {
    under_review: "Your adoption application is now under review.",
    approved: "Congratulations — your adoption application was approved!",
    rejected: "Your adoption application was not approved this time.",
    completed: "Your adoption is complete — welcome to your new pet!",
  };
  if (statusMessages[status]) {
    notify({
      user: application.applicant,
      type: `adoption_${status}`,
      title: "Adoption application update",
      message: statusMessages[status],
      relatedEntity: "AdoptionApplication",
      relatedEntityId: application._id,
    });
  }

  sendSuccess(res, 200, "Application updated successfully", { application });
});

// PATCH /api/adoptions/:id/withdraw  (owner withdraws their own application)
const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await AdoptionApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");

  if (application.applicant.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only withdraw your own applications");
  }
  if (["withdrawn", "completed", "rejected"].includes(application.status)) {
    throw new ApiError(400, `This application is already ${application.status}`);
  }

  application.status = "withdrawn";
  await application.save();

  const pet = await ShelterPet.findById(application.shelterPet);
  if (pet && pet.adoptionStatus === "application_pending") {
    pet.adoptionStatus = "available";
    await pet.save();
  }

  sendSuccess(res, 200, "Application withdrawn successfully", { application });
});

module.exports = {
  createApplication,
  getMyApplications,
  getShelterApplications,
  updateApplicationStatus,
  withdrawApplication,
};
