/**
 * SAE-V2 Webhook Controller (FINAL — PRODUCTION SAFE)
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

    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    /**
     * ✅ STRICT FILTER (NO NOISE)
     */
    if (!message || !message.from) return;

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
      return; // ignore unsupported types silently
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
     * ✅ SEND RESPONSE SAFELY
     */
    const outbound = {
      type: response.type,
      message: String(response.message),
      to: from,
    };

    try {
      await whatsappService.sendResponse(outbound);
      console.log("✅ WhatsApp message sent:", from);
    } catch (sendError) {
      console.error("❌ Send Error:", sendError.message);
    }

    /**
     * ✅ CLEAN LOGGING (NO UNDEFINED)
     */
    logChat({
      userId: from,
      message: text,
      response: outbound.message,
    });

  } catch (error) {
    console.error("❌ Webhook Error:", error.message);

    logError("webhook", error);
  }
};
