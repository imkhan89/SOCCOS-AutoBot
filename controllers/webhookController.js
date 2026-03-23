/**
 * SOCCOS-AutoBot
 * Webhook Controller (INTERFACE SEPARATED - FINAL)
 */

const env = require("../config/env");
const messagePipeline = require("../app/orchestration/messagePipeline");
const whatsappService = require("../services/whatsappService");

/**
 * GET /webhook
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
 * POST /webhook
 */
exports.handleWebhook = async (req, res) => {
  try {
    const body = req.body;

    console.log("📥 RAW BODY:", JSON.stringify(body, null, 2));

    // ✅ Acknowledge immediately
    res.sendStatus(200);

    const message =
      body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

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

    console.log("📥 Incoming:", { from, text });

    /**
     * 🔥 PIPELINE RETURNS RESPONSE
     */
    const response = await messagePipeline({ from, text });

    console.log("📤 Pipeline response:", response);

    /**
     * ✅ INTERFACE SENDS MESSAGE
     */
    if (response && response.type === "text") {
      await whatsappService.sendText(from, response.message);
    }

  } catch (error) {
    console.error("❌ Webhook Error:", error.message);
  }
};
