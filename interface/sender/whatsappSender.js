/**
 * SOCCOS-AutoBot
 * WhatsApp Sender (FINAL - SAFE & STABLE + INTEGRATED)
 * ---------------------------------------
 * ONLY:
 * - Sends payload to Meta API
 * - Accepts pipeline response
 * NO business logic
 */

const axios = require("axios");
const env = require("../../config/env");
const { buildPayload } = require("../formatters/formatter.integration");

/**
 * CORE SEND (LOW LEVEL)
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
      timeout: 10000,
    });

    console.log("✅ WhatsApp message sent:", payload.to);

    return response.data;

  } catch (error) {
    const errMsg =
      error.response?.data ||
      error.message ||
      "Unknown WhatsApp error";

    console.error("❌ WhatsApp Send Error:", errMsg);

    return null;
  }
}

/**
 * HIGH LEVEL SEND (NEW — USED BY PIPELINE)
 */
async function sendResponse(to, response) {
  try {
    if (!to || !response) {
      console.warn("⚠️ Missing to/response");
      return;
    }

    /**
     * Build formatted payload
     */
    const payload = buildPayload(to, response);

    if (!payload) {
      console.warn("⚠️ Payload build failed");
      return;
    }

    return await send(payload);

  } catch (error) {
    console.error("❌ sendResponse Error:", error.message);
    return null;
  }
}

module.exports = {
  send,          // keep existing (backward compatibility)
  sendResponse,  // new standard
};
