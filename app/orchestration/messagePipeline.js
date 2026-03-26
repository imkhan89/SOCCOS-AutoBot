/**
 * PIPELINE — UPDATED (STRICT ORCHESTRATION ONLY)
 */

const sessionMemory = require("../../data/memory/sessionMemory");
const logger = require("../../utils/logger");

// UX
const { resolveIntent } = require("../ux/intentResolver");
const { buildFlow } = require("../ux/flowBuilder");

// Sender
const { sendMessage } = require("../../interface/sender/whatsappSender");

/**
 * 🧹 NORMALIZE MESSAGE
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
 * ✅ VALIDATE RESPONSE STRUCTURE
 */
function isValidResponse(res) {
  if (!res || typeof res !== "object") return false;
  if (!res.type) return false;

  return (
    typeof res.message === "string" ||
    typeof res.body === "string"
  );
}

/**
 * 🚀 MAIN PIPELINE
 */
async function messagePipeline({ from, text }) {
  try {
    if (!from) return null;

    const rawMessage = text || "";
    const cleanedMessage = normalizeMessage(rawMessage);

    /**
     * 🧠 SESSION LOAD
     */
    let session = sessionMemory.getSession(from);

    /**
     * ⏱️ RATE LIMIT
     */
    if (
      session?.lastMessageTime &&
      Date.now() - session.lastMessageTime < 800
    ) {
      return null;
    }

    sessionMemory.updateSession(from, {
      lastMessageTime: Date.now(),
      lastActivity: Date.now(),
    });

    /**
     * 🧠 INTENT RESOLUTION
     */
    const intent = resolveIntent(cleanedMessage);

    /**
     * 🔁 FLOW BUILDER
     */
    const response = await buildFlow(from, intent, {
      text: rawMessage,
    });

    /**
     * ❌ INVALID RESPONSE GUARD
     */
    if (!isValidResponse(response)) {
      logger.warn("Invalid response", { from, intent });
      return null;
    }

    /**
     * 🧾 NORMALIZE RESPONSE
     */
    const normalizedResponse = {
      ...response,
      message: response.message || response.body || "",
    };

    /**
     * 📤 SEND (ISOLATED)
     */
    await sendMessage(from, normalizedResponse);

    return normalizedResponse;

  } catch (error) {
    logger.error("PipelineError", error);

    const fallback = {
      type: "text",
      message: "Something went wrong. Please try again.",
      meta: { screen: "pipeline_error" }
    };

    try {
      await sendMessage(from, fallback);
    } catch (e) {
      logger.error("SendFail", e);
    }

    return fallback;
  }
}

module.exports = messagePipeline;
