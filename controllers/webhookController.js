/**
 * SAE-V2 Webhook Controller (FINAL - HARDENED + LOGGING)
 * --------------------------------
 * Clean entry point
 * Uses pipeline.integration + sendResponse
 */

const env = require("../config/env");
const pipelineIntegration = require("../app/core/pipeline.integration");
const whatsappService = require("../services/whatsappService");

// Logging
const { logChat } = require("../services/logging/chatLogger");
const { logError } = require("../services/logging/errorLogger");

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
 * POST /webhook (Main Handler)
 */
exports.handleWebhook = async (req, res) => {
  try {
    // ✅ Always acknowledge immediately
    res.sendStatus(200);

    const message =
      req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      console.log("⚠️ No message object");
      return;
    }

    const from = message.from;
    if (!from) {
      console.log("⚠️ No sender");
      return;
    }

    let text = "";

    /**
     * SUPPORT ALL TYPES
     */
    if (message.text?.body) {
      text = message.text.body;
    } else if (message.button?.text) {
      text = message.button.text;
    } else if (message.interactive?.button_reply?.title) {
      text = message.interactive.button_reply.title;
    } else {
      console.log("⚠️ Unsupported message type");
      return;
    }

    text = text.trim();

    console.log("📥 Incoming:", { from, text });

    /**
     * 🧾 LOG INCOMING
     */
    logChat({
      userId: from,
      message: text,
    });

    /**
     * 🔥 PIPELINE
     */
    const response = await pipelineIntegration.runPipeline({
      from,
      text,
    });

    console.log("📤 Pipeline response:", response);

    /**
     * ✅ SEND RESPONSE
     */
    if (!response) return;

    response.to = from;

    await whatsappService.sendResponse(response);

    /**
     * 🧾 LOG OUTGOING
     */
    logChat({
      userId: from,
      message: text,
      response,
    });

  } catch (error) {
    console.error("❌ Webhook Error:", error.message);

    /**
     * 🚨 LOG ERROR
     */
    logError("webhook", error);
  }
};
