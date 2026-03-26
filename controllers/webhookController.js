/**
 * WEBHOOK CONTROLLER — UPDATED (SAFE + CONTROLLED)
 */

const env = require("../config/env");
const messagePipeline = require("../app/orchestration/messagePipeline");

const { logChat } = require("../services/logging/chatLogger");
const { logError } = require("../services/logging/errorLogger");

// 🧠 Deduplication cache
const processedMessages = new Set();
const MAX_CACHE = 1000;

/**
 * 🧹 CACHE CONTROL
 */
function maintainCache() {
  if (processedMessages.size >= MAX_CACHE) {
    const keys = processedMessages.values();
    processedMessages.delete(keys.next().value);
  }
}

/**
 * ✅ VERIFY WEBHOOK
 */
exports.verifyWebhook = (req, res) => {
  try {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === env.whatsapp.verifyToken) {
      return res.status(200).send(challenge);
    }

    return res.sendStatus(403);

  } catch (error) {
    logError("webhook_verify", error);
    return res.sendStatus(500);
  }
};

/**
 * 🧠 EXTRACT USER INPUT
 */
function extractUserInput(message) {
  if (!message) return "";

  if (message.text?.body) {
    return String(message.text.body).trim();
  }

  if (message.button?.payload) {
    return String(message.button.payload).trim();
  }

  if (message.interactive?.type === "button_reply") {
    return String(message.interactive.button_reply?.id || "").trim();
  }

  if (message.interactive?.type === "list_reply") {
    return String(message.interactive.list_reply?.id || "").trim();
  }

  return "";
}

/**
 * 🚀 HANDLE WEBHOOK
 */
exports.handleWebhook = async (req, res) => {
  try {
    // ✅ ACK immediately
    res.sendStatus(200);

    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    if (!message?.from) return;

    const from = String(message.from).trim();
    const messageId = message.id;

    // 🔴 DUPLICATE PROTECTION
    if (messageId) {
      if (processedMessages.has(messageId)) return;

      processedMessages.add(messageId);
      maintainCache();
    }

    // 🧠 INPUT EXTRACTION
    const text = extractUserInput(message);

    if (!text) return;

    let response = null;

    try {
      response = await messagePipeline({ from, text });
    } catch (pipelineError) {
      logError("pipeline_error", pipelineError);
      return;
    }

    // ✅ LOGGING ONLY
    if (response?.message) {
      logChat({
        userId: from,
        message: text,
        response: response.message,
      });
    }

  } catch (error) {
    logError("webhook_handler", error);
  }
};
