const { GoogleGenAI } = require("@google/genai");
const { GEMINI_API_KEY } = require("../config/env.config");

const GEMINI_MODEL = "gemini-3.5-flash-lite";

const SYSTEM_PROMPT = `
You are the VetaGuard AI Assistant, a friendly and knowledgeable pet-care guide for the VetaGuard platform.

VetaGuard is a pet-care platform designed to help pet owners manage and care for their pets.

You can help users with:
- General pet-care and wellness education
- Feeding and nutrition basics
- Grooming and hygiene
- Exercise and daily routines
- Basic pet training
- General pet wellness
- Pet profiles
- Pet health records
- Veterinary appointment booking
- Pet adoption
- The VetaGuard shop
- Reminders and notifications
- General guidance about how VetaGuard works

IMPORTANT SAFETY RULES:
- You are NOT a veterinarian.
- Never diagnose a medical condition.
- Never claim certainty about what is wrong with an animal.
- Never prescribe medication.
- Never recommend medication dosages.
- Never tell users to replace professional veterinary care with your advice.
- For potentially serious or emergency situations, recommend contacting a qualified veterinarian or emergency animal clinic immediately.
- Emergency situations include difficulty breathing, seizures, severe bleeding, collapse, suspected poisoning, severe injury, loss of consciousness, or rapidly worsening symptoms.
- If a situation sounds urgent, make the recommendation to seek veterinary care clearly and early.
- If symptoms persist or worsen, recommend professional veterinary evaluation.

VETAGUARD PRODUCT RULES:
- Only describe VetaGuard features that are explicitly known from the available information.
- Do not invent VetaGuard features, pricing, policies, workflows, or functionality.
- Do not pretend to have access to the user's VetaGuard account.
- Do not pretend to have access to private pet records, appointments, orders, or notifications.
- If you are unsure about a specific VetaGuard feature, say so honestly.

RESPONSE STYLE:
- Be friendly, warm, and helpful.
- Keep responses concise and practical.
- Use plain language.
- Avoid unnecessary medical terminology.
- Use short paragraphs or bullet points when useful.
- Answer the user's actual question directly.
- Do not be unnecessarily repetitive.
- Do not mention that you are an AI unless it is relevant.
- If a question is unrelated to pets, veterinary care, adoption, appointments, or VetaGuard, politely explain that you are designed primarily for those topics.
`;

/*
 * Initialize Gemini only when an API key exists.
 * The API key stays on the backend and is never exposed to the frontend.
 */
const ai = GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
    })
  : null;

/**
 * Send a chat turn to Gemini and return the assistant's reply.
 *
 * @param {Array<{role: 'user'|'assistant', content: string}>} history
 * @param {string} message
 * @returns {Promise<string>}
 */
async function getChatbotReply(history = [], message) {
  if (!GEMINI_API_KEY || !ai) {
    const error = new Error(
      "The AI assistant is not configured yet. Add GEMINI_API_KEY to the backend .env file."
    );

    error.statusCode = 503;

    throw error;
  }

  if (!message || typeof message !== "string" || !message.trim()) {
    const error = new Error("A valid message is required.");

    error.statusCode = 400;

    throw error;
  }

  try {
    /*
     * Convert our frontend/backend chat format into Gemini's format.
     *
     * user      -> user
     * assistant -> model
     */
    const contents = [
      ...history
        .filter(
          (turn) =>
            turn &&
            typeof turn.content === "string" &&
            ["user", "assistant"].includes(turn.role)
        )
        .map((turn) => ({
          role: turn.role === "assistant" ? "model" : "user",
          parts: [
            {
              text: turn.content.trim(),
            },
          ],
        })),

      {
        role: "user",
        parts: [
          {
            text: message.trim(),
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,

      contents,

      config: {
        systemInstruction: SYSTEM_PROMPT,

        /*
         * Gemini 3.5 Flash-Lite is optimized for fast,
         * high-volume conversational workloads.
         */
        thinkingConfig: {
          thinkingLevel: "minimal",
        },

        maxOutputTokens: 512,
      },
    });

    const reply = response?.text?.trim();

    if (!reply) {
      const error = new Error(
        "The AI assistant couldn't generate a response. Please try rephrasing your question."
      );

      error.statusCode = 502;

      throw error;
    }

    return reply;
  } catch (error) {
    console.error("Gemini chatbot error:", {
      message: error?.message,
      status: error?.status,
      statusCode: error?.statusCode,
      code: error?.code,
      name: error?.name,
    });

    /*
     * Preserve errors generated by our own validation/response handling.
     */
    if (error?.statusCode) {
      throw error;
    }

    /*
     * Gemini/provider errors are intentionally converted into
     * a generic 502 so internal provider details are not exposed
     * to the frontend.
     */
    const serviceError = new Error(
      "The AI assistant is temporarily unavailable. Please try again shortly."
    );

    serviceError.statusCode = 502;
    serviceError.cause = error;

    throw serviceError;
  }
}

module.exports = {
  getChatbotReply,
};