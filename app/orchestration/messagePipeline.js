/**
 * PIPELINE — OPTIMIZED (FUNNEL + STRICT + GUARANTEED SEND)
 */

const sessionMemory = require("../../data/memory/sessionMemory");

// UX
const { resolveIntent } = require("../ux/intentResolver");
const { buildFlow } = require("../ux/flowBuilder");

// Sender
const { sendMessage } = require("../../interface/sender/whatsappSender");

/**
 * NORMALIZE MESSAGE
 */
function normalizeMessage(text = "") {
  if (!text || typeof text !== "string") return "";

  return text
    .toLowerCase()
    .replace(/🔍/g, "")
    .replace(/search product/gi, "")
    .replace(/browse categories/gi, "")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * STRICT RESPONSE VALIDATION
 */
function isValidResponse(res) {
  if (!res || typeof res !== "object") return false;
  if (!res.type) return false;
  if (!res.message) return false;

  if (res.type === "interactive" && !res.buttons?.length) return false;
  if (res.type === "list" && !res.sections?.length) return false;

  if (!res.metadata) return false;

  return true;
}

/**
 * NORMALIZE RESPONSE (STRICT CONTRACT)
 */
function normalizeResponse(response = {}) {
  return {
    type: response.type,
    message: response.message,
    ...(response.buttons?.length ? { buttons: response.buttons } : {}),
    ...(response.sections?.length ? { sections: response.sections } : {}),
    metadata: response.metadata || {}
  };
}

/**
 * FALLBACK RESPONSE (FUNNEL OPTIMIZED)
 */
function getFallbackResponse() {
  return {
    type: "interactive",
    message: "Find the right auto part fast. What do you need?",
    buttons: [
      { id: "search_product", title: "Search Product" },
      { id: "browse_categories", title: "Browse Categories" },
      { id: "talk_support", title: "Talk to Support" }
    ],
    metadata: { screen: "fallback", funnel: "entry" }
  };
}

/**
 * MAIN PIPELINE
 */
async function messagePipeline({ from, text } = {}) {
  try {
    if (!from) return null;

    const rawMessage = text || "";
    const cleanedMessage = normalizeMessage(rawMessage);

    const session = sessionMemory.getSession(from) || {};

    // RATE LIMIT (RELAXED)
    if (
      session.lastMessageTime &&
      Date.now() - session.lastMessageTime < 300
    ) {
      return null;
    }

    sessionMemory.updateSession(from, {
      lastMessageTime: Date.now(),
      lastActivity: Date.now(),
      lastUserMessage: rawMessage
    });

    const intent = resolveIntent(cleanedMessage);

    let response = null;

    try {
      response = await buildFlow(from, intent, { text: rawMessage });
    } catch (e) {
      response = null;
    }

    // FALLBACK IF FLOW FAILS
    if (!isValidResponse(response)) {
      response = getFallbackResponse();
    }

    const normalizedResponse = normalizeResponse(response);

    // GUARANTEED SEND
    await sendMessage(from, normalizedResponse);

    return normalizedResponse;

  } catch (error) {
    const fallback = {
      type: "text",
      message: "Something went wrong. Please try again.",
      metadata: { screen: "pipeline_error" }
    };

    await sendMessage(from, fallback);

    return fallback;
  }
}

module.exports = messagePipeline;
