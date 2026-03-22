/**
 * SOCCOS-AutoBot
 * WhatsApp Sender (FINAL - SAFE & STABLE)
 * ---------------------------------------
 * ONLY:
 * - Sends payload to Meta API
 * NO business logic
 */

const axios = require("axios");
const env = require("../../config/env");

/**
 * SEND MESSAGE TO WHATSAPP API
 */
async function send(payload) {
  try {
    /**
     * Validate environment
     */
    if (
      !env?.whatsapp?.token ||
      !env?.whatsapp?.phoneNumberId ||
      !env?.whatsapp?.apiVersion
    ) {
      console.error("❌ Missing WhatsApp environment config");
      return;
    }

    /**
     * Validate payload
     */
    if (!payload || !payload.to) {
      console.error("❌ Invalid payload");
      return;
    }

    const url = `https://graph.facebook.com/${env.whatsapp.apiVersion}/${env.whatsapp.phoneNumberId}/messages`;

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${env.whatsapp.token}`,
        "Content-Type": "application/json",
      },
      timeout: 10000, // prevent hanging
    });

    console.log("✅ WhatsApp message sent:", payload.to);

    return response.data;

  } catch (error) {
    /**
     * Safe error handling (NO crash)
     */
    const errMsg =
      error.response?.data ||
      error.message ||
      "Unknown WhatsApp error";

    console.error("❌ WhatsApp Send Error:", errMsg);

    return null; // prevent upstream crash
  }
}

module.exports = {
  send,
};
