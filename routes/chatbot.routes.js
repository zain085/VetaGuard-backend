const express = require("express");
const rateLimit = require("express-rate-limit");
const { sendMessage } = require("../controllers/chatbot.controller");

const router = express.Router();

// Chatbot is public (available on the marketing site) but rate-limited to control API cost/abuse
const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many messages sent — please wait a moment before trying again.",
    errors: [],
  },
});

router.post("/message", chatbotLimiter, sendMessage);

module.exports = router;
