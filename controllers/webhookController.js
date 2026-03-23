/**
 * SOCCOS-AutoBot
 * Webhook Controller (FINAL - FIXED)
 */

const env = require("../config/env");
const messagePipeline = require("../app/orchestration/messagePipeline");

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

    // ✅ Always acknowledge immediately
    res.sendStatus(200);

    const message =
      body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) return;

    const from = message.from;
    if (!from) return;

    let text = "";

    if (message.text?.body) {
      text = message.text.body;
    } else if (message.button?.text) {
      text = message.button.text;
    } else if (message.interactive?.button_reply?.title) {
      text = message.interactive.button_reply.title;
    } else {
      return; // ignore unsupported messages
    }

    console.log("📥 Incoming:", { from, text });

    await messagePipeline({ from, text });

  } catch (error) {
    console.error("❌ Webhook Error:", error.message);
  }
};
