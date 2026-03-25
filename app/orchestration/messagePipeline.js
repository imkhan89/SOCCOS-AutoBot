/**
 * CLEAN PIPELINE — ORCHESTRATOR ONLY
 * No UI, No UX, No Business Logic
 */

const sessionMemory = require("../../data/memory/sessionMemory");
const logger = require("../../utils/logger");

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
     * 🚧 TEMPORARY RESPONSE (UNTIL UX LAYER IS BUILT)
     */
    return {
      type: "text",
      message: "Processing your request..."
    };

  } catch (error) {
    logger.error("Pipeline Error:", error);

    return {
      type: "text",
      message: "Something went wrong. Please try again."
    };
  }
}

module.exports = messagePipeline;
