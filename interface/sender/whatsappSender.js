/**
 * WHATSAPP SENDER — UPDATED (CONTROLLED + SCALABLE)
 */

const axios = require("axios");
const env = require("../../config/env");

// 🔁 RETRY CONFIG
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

// 🧠 DEDUPE CACHE
const sentMessages = new Set();
const MAX_CACHE = 1000;

/**
 * 🔒 CACHE CONTROL
 */
function maintainCache() {
  if (sentMessages.size >= MAX_CACHE) {
    const keys = sentMessages.values();
    sentMessages.delete(keys.next().value);
  }
}

/**
 * ⏱️ DELAY
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * ✅ ENV VALIDATION
 */
function isEnvValid() {
  return (
    env?.whatsapp?.token &&
    env?.whatsapp?.phoneNumberId &&
    env?.whatsapp?.apiVersion
  );
}

/**
 * 🧾 EXTRACT DISPLAY TEXT
 */
function getDisplayText(response = {}) {
  return (
    response.message ||
    response.body ||
    response.header ||
    response.title ||
    ""
  );
}

/**
 * ✅ VALIDATE RESPONSE
 */
function validateResponse(response) {
  if (!response || typeof response !== "object") {
    throw new Error("Invalid response");
  }

  if (!response.type) {
    throw new Error("Missing response type");
  }

  const text = getDisplayText(response);

  if (response.type === "text" && !text) {
    throw new Error("Empty text message");
  }

  if (response.type === "interactive") {
    if (!text && !Array.isArray(response.buttons)) {
      throw new Error("Invalid interactive message");
    }
  }

  if (response.type === "list") {
    if (!response.body || !Array.isArray(response.sections)) {
      throw new Error("Invalid list message");
    }
  }
}

/**
 * 🧱 BUILD PAYLOAD
 */
function buildPayload(to, response) {
  const type = response.type;
  const message = getDisplayText(response);

  if (type === "text") {
    return {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    };
  }

  if (type === "interactive") {
    return {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: message },
        action: {
          buttons: (response.buttons || []).slice(0, 3).map((btn) => ({
            type: "reply",
            reply: {
              id: String(btn.id),
              title: String(btn.title).substring(0, 20),
            },
          })),
        },
      },
    };
  }

  if (type === "list") {
    return {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        header: response.header
          ? { type: "text", text: String(response.header).substring(0, 60) }
          : undefined,
        body: { text: String(response.body).substring(0, 1024) },
        footer: response.footer
          ? { text: String(response.footer).substring(0, 60) }
          : undefined,
        action: {
          button: String(response.buttonText || "View").substring(0, 20),
          sections: (response.sections || []).map((section) => ({
            title: String(section.title || "").substring(0, 24),
            rows: (section.rows || []).slice(0, 10).map((row) => ({
              id: String(row.id).substring(0, 200),
              title: String(row.title).substring(0, 24),
              description: row.description
                ? String(row.description).substring(0, 72)
                : undefined,
            })),
          })),
        },
      },
    };
  }

  throw new Error("Unsupported type");
}

/**
 * 🚀 SEND CORE
 */
async function send(payload, attempt = 0) {
  try {
    if (!isEnvValid()) {
      console.error("WA ENV missing");
      return null;
    }

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

    console.error("WA Send Failed:", error?.message);
    return null;
  }
}

/**
 * 🎯 MAIN
 */
async function sendMessage(to, response) {
  try {
    if (!to || !response) return null;

    validateResponse(response);

    const key = `${to}:${response.type}:${getDisplayText(response)}`;

    if (sentMessages.has(key)) {
      return null;
    }

    sentMessages.add(key);
    maintainCache();

    const payload = buildPayload(to, response);

    return await send(payload);

  } catch (error) {
    console.error("sendMessageError:", error.message);
    return null;
  }
}

module.exports = {
  sendMessage,
};
