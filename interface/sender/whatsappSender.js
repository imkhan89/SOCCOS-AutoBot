/**
 * CLEAN WHATSAPP SENDER — SINGLE SOURCE OF TRUTH
 * --------------------------------------------
 * - No external formatter
 * - Strict validation
 * - Duplicate protection
 * - Retry safe
 */

const axios = require("axios");
const env = require("../../config/env");

// 🔁 RETRY CONFIG
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

// 🧠 DUPLICATE MESSAGE PROTECTION
const sentMessages = new Set();
const MAX_CACHE = 1000;

/**
 * ⏱️ DELAY
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 🧹 CLEAN DUPLICATE CACHE
 */
function maintainCache() {
  if (sentMessages.size > MAX_CACHE) {
    const firstKey = sentMessages.values().next().value;
    sentMessages.delete(firstKey);
  }
}

/**
 * 🔍 VALIDATE ENV
 */
function isEnvValid() {
  return (
    env?.whatsapp?.token &&
    env?.whatsapp?.phoneNumberId &&
    env?.whatsapp?.apiVersion
  );
}

/**
 * 🔍 VALIDATE RESPONSE
 */
function validateResponse(response) {
  if (!response) throw new Error("Empty response");

  if (!response.type || !response.message) {
    throw new Error("Invalid response structure");
  }
}

/**
 * 🧱 BUILD PAYLOAD (INTERNAL)
 */
function buildPayload(to, response) {
  return {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: {
      body: response.message,
    },
  };
}

/**
 * 🚀 CORE SEND (WITH RETRY)
 */
async function send(payload, attempt = 0) {
  try {
    if (!isEnvValid()) {
      console.error("❌ Missing WhatsApp env config");
      return null;
    }

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
 * 🎯 MAIN FUNCTION (USED BY CONTROLLER)
 */
async function sendResponse(to, response) {
  try {
    if (!to || !response) return null;

    validateResponse(response);

    // 🔴 DUPLICATE PREVENTION (based on message content)
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
    console.error("❌ sendResponse Error:", error.message);
    return null;
  }
}

module.exports = {
  send,
  sendResponse,
};
