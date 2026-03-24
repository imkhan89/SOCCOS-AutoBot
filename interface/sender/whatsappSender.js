/**
 * SOCCOS-AutoBot
 * WhatsApp Sender (FINAL — HARDENED + RELIABLE + INTEGRATED)
 * ---------------------------------------------------------
 * ONLY:
 * - Sends payload to Meta API
 * - Accepts pipeline response
 * NO business logic
 */

const axios = require("axios");
const env = require("../../config/env");
const { buildPayload } = require("../formatters/formatter.integration");

// 🔁 RETRY CONFIG
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

/**
 * ⏱️ DELAY HELPER
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 🔍 VALIDATE ENV CONFIG
 */
function isEnvValid() {
  return (
    env?.whatsapp?.token &&
    env?.whatsapp?.phoneNumberId &&
    env?.whatsapp?.apiVersion
  );
}

/**
 * CORE SEND (LOW LEVEL + RETRY)
 */
async function send(payload, attempt = 0) {
  try {
    /**
     * Validate environment
     */
    if (!isEnvValid()) {
      console.error("❌ Missing WhatsApp environment config");
      return null;
    }

    /**
     * Validate payload
     */
    if (!payload || !payload.to) {
      console.error("❌ Invalid payload");
      return null;
    }

    const url = `https://graph.facebook.com/${env.whatsapp.apiVersion}/${env.whatsapp.phoneNumberId}/messages`;

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${env.whatsapp.token}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    console.log("✅ WhatsApp message sent:", {
      to: payload.to,
      status: response.status,
    });

    return response.data;

  } catch (error) {
    const errMsg =
      error?.response?.data ||
      error?.message ||
      "Unknown WhatsApp error";

    console.error("❌ WhatsApp Send Error:", errMsg);

    /**
     * 🔁 RETRY LOGIC
     */
    if (attempt < MAX_RETRIES) {
      console.log(`🔁 Retrying send (${attempt + 1})...`);

      await delay(RETRY_DELAY);

      return send(payload, attempt + 1);
    }

    /**
     * 🚨 FINAL FAILURE (SAFE EXIT)
     */
    console.error("🚨 Final send failure:", {
      to: payload?.to,
    });

    return null;
  }
}

/**
 * HIGH LEVEL SEND (USED BY PIPELINE)
 */
async function sendResponse(to, response) {
  try {
    if (!to || !response) {
      console.warn("⚠️ Missing to/response");
      return null;
    }

    /**
     * Build formatted payload
     */
    const payload = buildPayload(to, response);

    if (!payload) {
      console.warn("⚠️ Payload build failed");
      return null;
    }

    return await send(payload);

  } catch (error) {
    console.error("❌ sendResponse Error:", error.message);
    return null;
  }
}

module.exports = {
  send,          // backward compatibility
  sendResponse,  // main pipeline method
};
