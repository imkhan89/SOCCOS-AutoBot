/**
 * SAE-V2 Webhook Controller (FINAL — HARDENED)
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

    const value =
      req.body?.entry?.[0]?.changes?.[0]?.value;

    const message = value?.messages?.[0];

    /**
     * ✅ STRICT FILTER (REMOVES ALL NOISE)
     * Ignore:
     * - status updates
     * - delivery receipts
     * - empty payloads
     */
    if (!message || !message.from) {
      return;
    }

    /**
     * ✅ ONLY PROCESS VALID MESSAGE TYPES
     */
    let text = "";

    if (message.text?.body) {
      text = message.text.body;
    } else if (message.button?.text) {
      text = message.button.text;
    } else if (message.interactive?.button_reply?.title) {
      text = message.interactive.button_reply.title;
    } else {
      return; // ignore everything else silently
    }

    text = text.trim();
    const from = message.from;

    if (!text) return;

    console.log("📥 Incoming:", { from, text });

    /**
     * PIPELINE
     */
    const runPipeline =
      pipelineIntegration.runPipeline || pipelineIntegration.run;

    if (typeof runPipeline !== "function") {
      throw new Error("Pipeline function not found");
    }

    const response = await runPipeline({ from, text });

    console.log("📤 Pipeline response:", response);

    if (!response || !response.type) return;

    /**
     * SEND RESPONSE
     */
    const outbound = {
      ...response,
      to: from,
    };

    await whatsappService.sendResponse(outbound);

    /**
     * ✅ SINGLE CLEAN LOG (AFTER RESPONSE)
     */
    logChat({
      userId: from,
      message: text,
      response: response.message || null,
    });

  } catch (error) {
    console.error("❌ Webhook Error:", error.message);

    logError("webhook", error);
  }
};
