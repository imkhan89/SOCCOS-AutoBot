/**
 * SOCCOS-AutoBot
 * Webhook Controller (FINAL - CLEAN)
 */

const env = require("../config/env");
const messagePipeline = require("../orchestration/messagePipeline");

/**
 * GET /webhook
 * Meta Verification
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

    console.error("❌ Verification Failed");
    return res.sendStatus(403);

  } catch (error) {
    console.error("❌ Verification Error:", error.message);
    return res.sendStatus(500);
  }
};

/**
 * POST /webhook
 * Handle Incoming WhatsApp Messages
 */
exports.handleWebhook = async (req, res) => {
  try {
    const body = req.body;

    /**
     * Always acknowledge webhook first (Meta requirement)
     */
    res.sendStatus(200);

    /**
     * Validate payload safely
     */
    const message =
      body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) return;

    const from = message.from;

    /**
     * Handle different message types
     */
    let text = "";

    if (message.text?.body) {
      text = message.text.body;
    } else if (message.button?.text) {
      text = message.button.text;
    } else if (message.interactive?.button_reply?.title) {
      text = message.interactive.button_reply.title;
    } else {
      text = "unsupported";
    }

    console.log("📥 Incoming:", { from, text });

    /**
     * Pass to pipeline (ONLY CALL)
     */
    await messagePipeline({
      from,
      text,
    });

  } catch (error) {
    console.error("❌ Webhook Error:", error.message);
  }
};
