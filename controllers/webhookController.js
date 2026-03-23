/**
 * SOCCOS-AutoBot
 * Webhook Controller (FINAL — CLEAN + HARDENED)
 */

const env = require("../config/env");
const messagePipeline = require("../app/orchestration/messagePipeline");
const whatsappService = require("../services/whatsappService");

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
    const body = req.body;

    // ✅ Always acknowledge immediately (critical for WhatsApp)
    res.sendStatus(200);

    // 🔍 Extract message safely
    const message =
      body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      console.log("⚠️ No message object (status update or delivery event)");
      return;
    }

    const from = message.from;
    if (!from) {
      console.log("⚠️ No sender");
      return;
    }

    let text = "";

    // ✅ Handle all supported message types
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
     * 🔥 PIPELINE (CORE BRAIN)
     */
    const response = await messagePipeline({ from, text });

    console.log("📤 Pipeline response:", response);

    /**
     * ✅ SEND RESPONSE
     */
    if (!response) return;

    if (response.type === "text") {
      await whatsappService.sendText(from, response.message);
    }

    if (response.type === "image") {
      await whatsappService.sendImage(from, response.image, response.caption);
    }

  } catch (error) {
    console.error("❌ Webhook Error:", error.message);
  }
};
