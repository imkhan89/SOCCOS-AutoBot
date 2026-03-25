/**
 * CLEAN PIPELINE — ORCHESTRATOR ONLY (FIXED)
 * ------------------------------------------
 * - Query normalization added
 * - Async flowBuilder fixed
 * - Response validation fixed
 */

const sessionMemory = require("../../data/memory/sessionMemory");
const logger = require("../../utils/logger");

// ✅ UX ENGINE
const { resolveIntent } = require("../ux/intentResolver");
const { buildFlow } = require("../ux/flowBuilder");

// ✅ SENDER
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

async function messagePipeline({ from, text }) {
  try {
    if (!from) {
      logger.warn("No userId (from) provided");
      return null;
    }

    const rawMessage = text || "";
    const cleanedMessage = normalizeMessage(rawMessage);

    /**
     * ✅ LOAD SESSION
     */
    let session = sessionMemory.getSession(from) || {};

    /**
     * ✅ UPDATE ACTIVITY
     */
    sessionMemory.updateSession(from, {
      lastActivity: Date.now(),
    });

    /**
     * ✅ RATE LIMIT
     */
    if (
      session.lastMessageTime &&
      Date.now() - session.lastMessageTime < 1000
    ) {
      return null;
    }

    sessionMemory.updateSession(from, {
      lastMessageTime: Date.now(),
    });

    /**
     * 🔄 REFRESH SESSION
     */
    session = sessionMemory.getSession(from) || {};

    /**
     * 🧠 STEP 1 — INTENT (CLEAN INPUT)
     */
    const intent = resolveIntent(cleanedMessage);

    logger.info("🧠 Intent:", intent);
    logger.info("🧹 Cleaned Message:", cleanedMessage);

    /**
     * 🔁 STEP 2 — BUILD FLOW (FIX: AWAIT)
     */
    const response = await buildFlow(from, intent, {
      rawMessage,
      cleanedMessage,
    });

    /**
     * ❌ FIX: VALIDATION (message OR body)
     */
    if (!response || (!response.message && !response.body)) {
      logger.warn("Invalid response generated", { from, intent });
      return null;
    }

    /**
     * ✅ NORMALIZE RESPONSE FOR SENDER
     */
    const normalizedResponse = {
      ...response,
      message: response.message || response.body || "",
    };

    /**
     * 📤 STEP 3 — SEND
     */
    await sendMessage(from, normalizedResponse);

    return normalizedResponse;

  } catch (error) {
    logger.error("Pipeline Error:", error);

    const fallback = {
      type: "text",
      message: "⚠️ Something went wrong. Please try again.",
      meta: { screen: "pipeline_error" }
    };

    try {
      await sendMessage(from, fallback);
    } catch (sendError) {
      logger.error("Sender Failed:", sendError);
    }

    return fallback;
  }
}

module.exports = messagePipeline;
