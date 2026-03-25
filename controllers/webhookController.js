/**
 * CLEAN WEBHOOK CONTROLLER — PRODUCTION SAFE (FIXED)
 * Role: Validate → Deduplicate → Extract CORRECT INPUT → Forward
 */

const env = require("../config/env");

// ✅ PIPELINE (handles EVERYTHING including sending)
const messagePipeline = require("../app/orchestration/messagePipeline");

// Logging
const { logChat } = require("../services/logging/chatLogger");
const { logError } = require("../services/logging/errorLogger");

/**
 * 🧠 Deduplication cache
 */
const processedMessages = new Set();
const MAX_CACHE = 1000;

/**
 * GET /webhook (Verification)
 */
exports.verifyWebhook = (req, res) => {
  try {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === env.whatsapp.verifyToken) {
      console.log("✅ Webhook Verified");
      return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
  } catch (error) {
    console.error("❌ Verification Error:", error.message);
    return res.sendStatus(500);
  }
};

/**
 * 🧹 Maintain deduplication cache
 */
function maintainCache() {
  if (processedMessages.size > MAX_CACHE) {
    const firstKey = processedMessages.values().next().value;
    processedMessages.delete(firstKey);
  }
}

/**
 * 🧠 CORRECT MESSAGE EXTRACTION (CRITICAL FIX)
 */
function extractUserInput(message) {
  // TEXT MESSAGE
  if (message.text?.body) {
    return message.text.body.trim();
  }

  // BUTTON (legacy)
  if (message.button?.payload) {
    return message.button.payload.trim();
  }

  // INTERACTIVE BUTTON (IMPORTANT)
  if (message.interactive?.type === "button_reply") {
    return message.interactive.button_reply.id.trim(); // ✅ FIXED
  }

  // INTERACTIVE LIST (IMPORTANT)
  if (message.interactive?.type === "list_reply") {
    return message.interactive.list_reply.id.trim(); // ✅ FIXED
  }

  return "";
}

/**
 * POST /webhook (Main Handler)
 */
exports.handleWebhook = async (req, res) => {
  try {
    // ✅ ACK FIRST (CRITICAL)
    res.sendStatus(200);

    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    if (!message || !message.from) return;

    /**
     * 🔴 DUPLICATE PROTECTION
     */
    const messageId = message.id;

    if (messageId && processedMessages.has(messageId)) return;

    if (messageId) {
      processedMessages.add(messageId);
      maintainCache();
    }

    /**
     * ✅ CORRECT INPUT EXTRACTION
     */
    const text = extractUserInput(message);
    const from = String(message.from).trim();

    if (!text) {
      console.log("⚠️ Empty input received — skipping");
      return;
    }

    console.log("📥 Incoming:", { from, text });

    /**
     * 🚀 PIPELINE (handles intent + flow + sending)
     */
    let response = null;

    try {
      response = await messagePipeline({ from, text });
    } catch (pipelineError) {
      console.error("❌ Pipeline Error:", pipelineError.message);
    }

    console.log("📤 Pipeline response:", response);

    /**
     * ✅ LOGGING ONLY (NO SENDING HERE)
     */
    if (response?.message) {
      logChat({
        userId: from,
        message: text,
        response: response.message,
      });
    }

  } catch (error) {
    console.error("❌ Webhook Error:", error.message);
    logError("webhook", error);
  }
};
