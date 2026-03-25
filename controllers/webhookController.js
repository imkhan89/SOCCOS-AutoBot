/**
 * CLEAN WEBHOOK CONTROLLER — PRODUCTION SAFE
 * Role: Validate → Deduplicate → Forward ONLY
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
     * ✅ SAFE TEXT EXTRACTION
     */
    let text = "";

    if (message.text?.body) {
      text = message.text.body;
    } else if (message.button?.text) {
      text = message.button.text;
    } else if (message.interactive?.button_reply?.title) {
      text = message.interactive.button_reply.title;
    } else {
      return;
    }

    text = String(text).trim();
    const from = String(message.from).trim();

    if (!text) return;

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
