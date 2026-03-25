/**
 * CLEAN WHATSAPP SENDER — SINGLE SOURCE OF TRUTH
 */

const axios = require("axios");
const env = require("../../config/env");

// 🔁 RETRY CONFIG
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

// 🧠 DUPLICATE MESSAGE PROTECTION
const sentMessages = new Set();
const MAX_CACHE = 1000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function maintainCache() {
  if (sentMessages.size > MAX_CACHE) {
    const firstKey = sentMessages.values().next().value;
    sentMessages.delete(firstKey);
  }
}

function isEnvValid() {
  return (
    env?.whatsapp?.token &&
    env?.whatsapp?.phoneNumberId &&
    env?.whatsapp?.apiVersion
  );
}

function validateResponse(response) {
  if (!response) throw new Error("Empty response");

  if (!response.type || !response.message) {
    throw new Error("Invalid response structure");
  }
}

/**
 * 🧱 BUILD PAYLOAD
 */
function buildPayload(to, response) {
  const { type, message, buttons = [] } = response;

  // ---------------- TEXT ----------------
  if (type === "text") {
    return {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body: message,
      },
    };
  }

  // ---------------- INTERACTIVE ----------------
  if (type === "interactive") {
    return {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: message,
        },
        action: {
          buttons: buttons.map((btn) => ({
            type: "reply",
            reply: {
              id: btn.id,
              title: btn.title,
            },
          })),
        },
      },
    };
  }

  throw new Error("Unsupported message type");
}

/**
 * 🚀 SEND CORE
 */
async function send(payload, attempt = 0) {
  try {
    if (!isEnvValid()) {
      console.error("❌ Missing WhatsApp env config");
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

    console.log("✅ Message sent:", payload.to);
    return response.data;

  } catch (error) {
    const errMsg =
      error?.response?.data ||
      error?.message ||
      "Unknown error";

    console.error("❌ Send Error:", errMsg);

    if (attempt < MAX_RETRIES) {
      console.log(`🔁 Retry (${attempt + 1})...`);
      await delay(RETRY_DELAY);
      return send(payload, attempt + 1);
    }

    console.error("🚨 Final failure:", payload?.to);
    return null;
  }
}

/**
 * 🎯 MAIN FUNCTION (PIPELINE USES THIS)
 */
async function sendMessage(to, response) {
  try {
    if (!to || !response) return null;

    validateResponse(response);

    const key = `${to}:${response.message}`;

    if (sentMessages.has(key)) {
      console.warn("⚠️ Duplicate message blocked");
      return null;
    }

    sentMessages.add(key);
    maintainCache();

    const payload = buildPayload(to, response);

    return await send(payload);

  } catch (error) {
    console.error("❌ sendMessage Error:", error.message);
    throw error;
  }
}

module.exports = {
  sendMessage
};
