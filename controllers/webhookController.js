/**
 * SAE-V2 Webhook Controller (FINAL — HARDENED + PRODUCTION SAFE)
 */

const env = require("../config/env");
const pipelineIntegration = require("../app/core/pipeline.integration");

// ✅ Use correct sender (Step 7 aligned)
const whatsappSender = require("../interface/sender/whatsappSender");

// Logging
const { logChat } = require("../services/logging/chatLogger");
const { logError } = require("../services/logging/errorLogger");

/**
 * 🧠 Deduplication cache (in-memory)
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
 * 🧹 Maintain deduplication cache size
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
    // ✅ Always acknowledge immediately
    res.sendStatus(200);

    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    /**
     * ✅ STRICT FILTER (NO NOISE)
     */
    if (!message || !message.from) return;

    /**
     * 🔴 DUPLICATE PROTECTION (CRITICAL)
     */
    const messageId = message.id;
    if (messageId && processedMessages.has(messageId)) {
      return;
    }

    if (messageId) {
      processedMessages.add(messageId);
      maintainCache();
    }

    /**
     * ✅ EXTRACT TEXT SAFELY
     */
    let text = "";

    if (message.text?.body) {
      text = message.text.body;
    } else if (message.button?.text) {
      text = message.button.text;
    } else if (message.interactive?.button_reply?.title) {
      text = message.interactive.button_reply.title;
    } else {
      return; // ignore unsupported types
    }

    text = String(text).trim();
    const from = String(message.from).trim();

    if (!text) return;

    console.log("📥 Incoming:", { from, text });

    /**
     * ✅ PIPELINE SAFE EXECUTION
     */
    const runPipeline =
      pipelineIntegration.runPipeline || pipelineIntegration.run;

    if (typeof runPipeline !== "function") {
      throw new Error("Pipeline function not found");
    }

    let response = null;

    try {
      response = await runPipeline({ from, text });
    } catch (pipelineError) {
      console.error("❌ Pipeline Error:", pipelineError.message);

      response = {
        type: "text",
        message: "⚠️ Temporary issue. Please try again.",
      };
    }

    console.log("📤 Pipeline response:", response);

    /**
     * ✅ VALIDATE RESPONSE
     */
    if (!response || !response.type || !response.message) return;

    /**
     * ✅ SEND RESPONSE (Step 7 aligned)
     */
    try {
      await whatsappSender.sendResponse(from, response);
      console.log("✅ WhatsApp message sent:", from);
    } catch (sendError) {
      console.error("❌ Send Error:", sendError.message);
    }

    /**
     * ✅ CLEAN LOGGING
     */
    logChat({
      userId: from,
      message: text,
      response: response.message,
    });

  } catch (error) {
    console.error("❌ Webhook Error:", error.message);
    logError("webhook", error);
  }
};
