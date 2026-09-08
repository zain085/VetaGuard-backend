const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { getChatbotReply } = require("../services/chatbot.service");

const MAX_HISTORY_TURNS = 12;
const MAX_MESSAGE_LENGTH = 1000;

const sendMessage = asyncHandler(async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    throw new ApiError(400, "A message is required");
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new ApiError(
      400,
      `Message is too long (max ${MAX_MESSAGE_LENGTH} characters)`
    );
  }

  const safeHistory = Array.isArray(history)
    ? history
        .filter(
          (t) =>
            t &&
            typeof t.content === "string" &&
            ["user", "assistant"].includes(t.role)
        )
        .slice(-MAX_HISTORY_TURNS)
    : [];

  try {
    const reply = await getChatbotReply(safeHistory, message.trim());

    sendSuccess(res, 200, "Reply generated", { reply });
  } catch (error) {
    console.error("Chatbot controller error:", error);

    throw new ApiError(
      502,
      "The AI assistant is temporarily unavailable. Please try again shortly."
    );
  }
});

module.exports = { sendMessage };