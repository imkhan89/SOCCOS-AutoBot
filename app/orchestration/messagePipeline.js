/**
 * CLEAN PIPELINE — ORCHESTRATOR ONLY
 * No UI, No Business Logic
 */

const sessionMemory = require("../../data/memory/sessionMemory");
const logger = require("../../utils/logger");

// ✅ NEW IMPORTS (UX ENGINE + SENDER)
const { resolveIntent } = require("../ux/intentResolver");
const { buildFlow } = require("../ux/flowBuilder");
const { sendMessage } = require("../../interface/sender/whatsappSender");

async function messagePipeline({ from, text }) {
  try {
    if (!from) {
      logger.warn("No userId (from) provided");
      return null;
    }

    const message = text?.trim() || "";

    /**
     * ✅ LOAD SESSION
     */
    let session = sessionMemory.getSession(from) || {};

    /**
     * ✅ UPDATE LAST ACTIVITY (CRITICAL FOR RECOVERY ENGINE)
     */
    sessionMemory.updateSession(from, {
      lastActivity: Date.now(),
    });

    /**
     * ✅ BASIC RATE LIMIT (ANTI-SPAM)
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
     * 🧠 STEP 1 — RESOLVE INTENT
     */
    const intent = resolveIntent(message);

    /**
     * 🔁 STEP 2 — BUILD FLOW (UI RESPONSE)
     */
    const response = buildFlow(from, intent);

    if (!response || !response.message) {
      logger.warn("Invalid response generated", { from, intent });
      return null;
    }

    /**
     * 📤 STEP 3 — SEND MESSAGE (SINGLE SOURCE)
     */
    await sendMessage(from, response);

    return response;

  } catch (error) {
    logger.error("Pipeline Error:", error);

    // ✅ FAIL-SAFE RESPONSE
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
