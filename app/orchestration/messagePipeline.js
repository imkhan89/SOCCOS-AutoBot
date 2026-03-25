/**
 * CLEAN PIPELINE — ORCHESTRATOR ONLY (UPDATED)
 * --------------------------------------------
 * - Added Query Normalization (PRE-INTENT)
 * - No UI logic added
 * - Keeps architecture intact
 */

const sessionMemory = require("../../data/memory/sessionMemory");
const logger = require("../../utils/logger");

// ✅ UX ENGINE
const { resolveIntent } = require("../ux/intentResolver");
const { buildFlow } = require("../ux/flowBuilder");

// ✅ SENDER
const { sendMessage } = require("../../interface/sender/whatsappSender");

/**
 * 🧹 NORMALIZE QUERY (CRITICAL FIX)
 */
function normalizeMessage(text = "") {
  if (!text || typeof text !== "string") return "";

  return text
    .toLowerCase()
    .replace(/🔍/g, "")
    .replace(/search product/gi, "")
    .replace(/browse categories/gi, "")
    .replace(/^\s+|\s+$/g, "") // trim
    .replace(/\s+/g, " "); // normalize spaces
}

async function messagePipeline({ from, text }) {
  try {
    if (!from) {
      logger.warn("No userId (from) provided");
      return null;
    }

    const rawMessage = text || "";
    const normalizedMessage = normalizeMessage(rawMessage);

    /**
     * ✅ LOAD SESSION
     */
    let session = sessionMemory.getSession(from) || {};

    /**
     * ✅ UPDATE LAST ACTIVITY
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
     * 🧠 STEP 1 — RESOLVE INTENT (USE CLEAN MESSAGE)
     */
    const intent = resolveIntent(normalizedMessage);

    logger.info("🧠 Intent:", intent);
    logger.info("🧹 Cleaned Message:", normalizedMessage);

    /**
     * 🔁 STEP 2 — BUILD FLOW
     */
    const response = buildFlow(from, intent, {
      rawMessage,
      cleanedMessage: normalizedMessage,
    });

    if (!response || !response.message) {
      logger.warn("Invalid response generated", { from, intent });
      return null;
    }

    /**
     * 📤 STEP 3 — SEND MESSAGE
     */
    await sendMessage(from, response);

    return response;

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
