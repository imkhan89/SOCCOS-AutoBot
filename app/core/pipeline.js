/**
 * SAE-V2 CORE PIPELINE (FINAL - HARDENED + LOGGING)
 * --------------------------------
 * Orchestrator ONLY
 * NO UI, NO business logic
 */

const sessionMemory = require("../../data/memory/sessionMemory");

// Integrations
const menuIntegration = require("../menus/menu.integration");
const searchIntegration = require("../../services/search/search.integration");
const aiIntegration = require("../../services/ai/ai.integration");
const middleware = require("../../services/middleware/middleware.integration");

// Logging
const { logChat } = require("../../services/logging/chatLogger");
const { logError } = require("../../services/logging/errorLogger");

async function run({ from, text }) {
  try {
    if (!from || !text) {
      console.warn("⚠️ Missing input:", { from, text });
      return null;
    }

    /**
     * 1. PRE-PROCESS (MIDDLEWARE)
     */
    let processed;
    try {
      processed = await middleware.process({ from, text });
    } catch (err) {
      console.error("❌ Middleware failed:", err.message);
      processed = { text }; // fallback
    }

    const cleanText = (processed?.text || text || "")
      .toString()
      .trim()
      .toLowerCase();

    if (!cleanText) {
      const response = {
        type: "text",
        message: "Please enter a valid input",
      };

      logChat({ userId: from, message: text, response });
      return response;
    }

    const session = sessionMemory.getSession(from);

    let response = null;

    /**
     * 2. ORDER FLOW (HIGHEST PRIORITY)
     */
    if (session.order && session.order.step) {
      response = await menuIntegration.handleOrder(from, cleanText);
      if (response) {
        logChat({ userId: from, message: cleanText, response });
        return response;
      }
    }

    /**
     * 3. MENU SYSTEM
     */
    response = await menuIntegration.handleMenu(from, cleanText);
    if (response) {
      logChat({ userId: from, message: cleanText, response });
      return response;
    }

    /**
     * 4. SEARCH MODULE
     */
    response = await searchIntegration.handleSearch(from, cleanText);
    if (response) {
      logChat({ userId: from, message: cleanText, response });
      return response;
    }

    /**
     * 5. AI FALLBACK
     */
    response = await aiIntegration.handleAI(from, cleanText);
    if (response) {
      logChat({ userId: from, message: cleanText, response });
      return response;
    }

    /**
     * DEFAULT RESPONSE
     */
    response = {
      type: "text",
      message: "Invalid input. Please try again.",
    };

    logChat({ userId: from, message: cleanText, response });

    return response;

  } catch (error) {
    console.error("❌ Pipeline Error:", error.message);

    logError("pipeline", error);

    return {
      type: "text",
      message: "System error. Please try again later.",
    };
  }
}

module.exports = { run };
