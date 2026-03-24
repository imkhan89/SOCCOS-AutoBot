/**
 * SAE-V2 Webhook Controller (FINAL — FIXED + CLEAN LOGGING)
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

    // ✅ FIX 1: Ignore non-message events (NO SPAM)
    if (!message || !message.from) {
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
      return; // ignore unsupported silently
    }

    text = text.trim();

    console.log("📥 Incoming:", { from: message.from, text });

    /**
     * PIPELINE
     */
    const runPipeline =
      pipelineIntegration.runPipeline || pipelineIntegration.run;

    if (typeof runPipeline !== "function") {
      throw new Error("Pipeline integration function not found");
    }

    const response = await runPipeline({
      from: message.from,
      text,
    });

    console.log("📤 Pipeline response:", response);

    if (!response) return;

    /**
     * SEND RESPONSE
     */
    const outbound = {
      ...response,
      to: message.from,
    };

    await whatsappService.sendResponse(outbound);

    /**
     * ✅ FIX 2: SINGLE CLEAN LOG (NO DUPLICATES, NO UNDEFINED)
     */
    logChat({
      userId: message.from,
      message: text,
      response: response?.message || null,
    });

  } catch (error) {
    console.error("❌ Webhook Error:", error.message);

    /**
     * LOG ERROR
     */
    logError("webhook", error);
  }
};
