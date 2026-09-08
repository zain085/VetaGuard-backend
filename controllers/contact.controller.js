const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const ContactMessage = require("../models/ContactMessage");

// POST /api/contact — public
const submitContactMessage = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;
  await ContactMessage.create({ name, email, subject, message });
  sendSuccess(res, 201, "Your message has been sent — we'll get back to you soon.", {});
});

// GET /api/contact — admin only
const listContactMessages = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [messages, total] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    ContactMessage.countDocuments(filter),
  ]);

  sendSuccess(res, 200, "Messages retrieved successfully", {
    messages,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

// PATCH /api/contact/:id/status — admin only
const updateContactMessageStatus = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findById(req.params.id);
  if (!message) throw new ApiError(404, "Message not found");
  message.status = req.body.status;
  await message.save();
  sendSuccess(res, 200, "Message status updated", { message });
});

module.exports = { submitContactMessage, listContactMessages, updateContactMessageStatus };
