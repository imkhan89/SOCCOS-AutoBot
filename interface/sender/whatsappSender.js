/**
 * CLEAN WHATSAPP SENDER — SINGLE SOURCE OF TRUTH (UPDATED)
 * --------------------------------------------------------
 * Fixes:
 * - Supports text messages
 * - Supports button-based interactive messages
 * - Supports list-based interactive messages
 * - Accepts both message/body style responses
 * - Keeps retry + duplicate protection
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

function getDisplayText(response = {}) {
  return (
    response.message ||
    response.body ||
    response.header ||
    response.title ||
    ""
  );
}

function validateResponse(response) {
  if (!response || typeof response !== "object") {
    throw new Error("Empty response");
  }

  if (!response.type) {
    throw new Error("Invalid response structure");
  }

  const displayText = getDisplayText(response);

  if (response.type === "text") {
    if (!displayText) {
      throw new Error("Text message is missing body");
    }
    return;
  }

  if (response.type === "interactive") {
    if (!displayText && !Array.isArray(response.buttons) && !Array.isArray(response.sections)) {
      throw new Error("Interactive message is missing content");
    }
    return;
  }

  if (response.type === "list") {
    if (
      !response.body ||
      !Array.isArray(response.sections) ||
      response.sections.length === 0
    ) {
      throw new Error("List message is missing body or sections");
    }
    return;
  }

  throw new Error("Invalid response type");
}

/**
 * 🧱 BUILD PAYLOAD
 */
function buildPayload(to, response) {
  const type = response.type;
  const message = getDisplayText(response);
  const buttons = Array.isArray(response.buttons) ? response.buttons : [];

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

  // ---------------- BUTTON INTERACTIVE ----------------
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
          buttons: buttons.slice(0, 3).map((btn) => ({
            type: "reply",
            reply: {
              id: btn.id,
              title: String(btn.title || "").substring(0, 20),
            },
          })),
        },
      },
    };
  }

  // ---------------- LIST INTERACTIVE ----------------
  if (type === "list") {
    const sections = Array.isArray(response.sections) ? response.sections : [];

    return {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        header: response.header
          ? {
              type: "text",
              text: String(response.header).substring(0, 60),
            }
          : undefined,
        body: {
          text: String(response.body || "").substring(0, 1024),
        },
        footer: response.footer
          ? {
              text: String(response.footer).substring(0, 60),
            }
          : undefined,
        action: {
          button: String(response.buttonText || "View Products").substring(0, 20),
          sections: sections.map((section) => ({
            title: String(section.title || "Products").substring(0, 24),
            rows: (Array.isArray(section.rows) ? section.rows : []).slice(0, 10).map((row) => ({
              id: String(row.id || "").substring(0, 200),
              title: String(row.title || "Item").substring(0, 24),
              description: row.description
                ? String(row.description).substring(0, 72)
                : undefined,
            })),
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

    const dedupeText = getDisplayText(response) || JSON.stringify(response);
    const key = `${to}:${response.type}:${dedupeText}`;

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
  sendMessage,
};
