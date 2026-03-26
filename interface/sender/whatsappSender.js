/**
 * WHATSAPP SENDER — FINAL FIXED (PRODUCTION SAFE + META COMPLIANT)
 */

const axios = require("axios");
const env = require("../../config/env");

// RETRY CONFIG
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

// DEDUPE CACHE
const sentMessages = new Set();
const MAX_CACHE = 1000;

function maintainCache() {
  if (sentMessages.size >= MAX_CACHE) {
    const keys = sentMessages.values();
    sentMessages.delete(keys.next().value);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isEnvValid() {
  return (
    env?.whatsapp?.token &&
    env?.whatsapp?.phoneNumberId &&
    env?.whatsapp?.apiVersion
  );
}

/**
 * STRICT MESSAGE EXTRACTION (FIXED)
 */
function getMessage(response = {}) {
  return response.message || "";
}

/**
 * STRICT VALIDATION (FIXED TO MATCH CONTRACT)
 */
function validateResponse(response) {
  if (!response || typeof response !== "object") return false;
  if (!response.type) return false;
  if (!response.message) return false;

  if (response.type === "interactive" && !response.buttons?.length) return false;
  if (response.type === "list" && !response.sections?.length) return false;

  return true;
}

/**
 * CLEAN PAYLOAD BUILDER (STRICT META FORMAT)
 */
function buildPayload(to, response) {
  const message = getMessage(response);

  if (response.type === "text") {
    return {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    };
  }

  if (response.type === "interactive") {
    return {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: message },
        action: {
          buttons: response.buttons.slice(0, 3).map((btn) => ({
            type: "reply",
            reply: {
              id: String(btn.id),
              title: String(btn.title).slice(0, 24),
            },
          })),
        },
      },
    };
  }

  if (response.type === "list") {
    return {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        body: { text: message },
        action: {
          button: "View Options",
          sections: response.sections.slice(0, 10).map((section) => ({
            title: String(section.title).slice(0, 24),
            rows: section.rows.slice(0, 10).map((row) => ({
              id: String(row.id),
              title: String(row.title).slice(0, 24),
              description: row.description
                ? String(row.description).slice(0, 72)
                : undefined,
            })),
          })),
        },
      },
    };
  }

  return null;
}

/**
 * SEND CORE (NO CONSOLE LOGS)
 */
async function send(payload, attempt = 0) {
  try {
    if (!isEnvValid()) return null;

    const url = `https://graph.facebook.com/${env.whatsapp.apiVersion}/${env.whatsapp.phoneNumberId}/messages`;

    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${env.whatsapp.token}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    return res.data;
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      await delay(RETRY_DELAY);
      return send(payload, attempt + 1);
    }
    return null;
  }
}

/**
 * MAIN
 */
async function sendMessage(to, response) {
  try {
    if (!to || !validateResponse(response)) return null;

    const key = `${to}:${response.type}:${response.message}`;

    if (sentMessages.has(key)) return null;

    sentMessages.add(key);
    maintainCache();

    const payload = buildPayload(to, response);
    if (!payload) return null;

    return await send(payload);
  } catch (error) {
    return null;
  }
}

module.exports = {
  sendMessage,
};
