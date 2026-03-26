/**
 * SAE-V2 CORE PIPELINE (FINAL - HARDENED + CLEAN)
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

/**
 * 🧾 NORMALIZE RESPONSE (STRICT SCHEMA)
 */
function normalizeResponse(response = {}) {
  return {
    type: response.type,
    message: response.message || "",
    ...(Array.isArray(response.buttons) && response.buttons.length
      ? { buttons: response.buttons }
      : {}),
    ...(Array.isArray(response.sections) && response.sections.length
      ? { sections: response.sections }
      : {}),
    metadata: response.metadata || {}
  };
}

async function run({ from, text } = {}) {
  try {
    if (!from || !text) {
      return null;
    }

    /**
     * 1. PRE-PROCESS (MIDDLEWARE)
     */
    let processed;
    try {
      processed = await middleware.process({ from, text });
    } catch (err) {
      processed = { text };
    }

    const cleanText = (processed?.text || text || "")
      .toString()
      .trim()
      .toLowerCase();

    if (!cleanText) {
      const response = normalizeResponse({
        type: "text",
        message: "Please enter a valid input",
        metadata: { screen: "invalid_input" }
      });

      logChat({ userId: from, message: text, response });
      return response;
    }

    const session = sessionMemory.getSession(from) || {};

    let response = null;

    /**
     * 2. ORDER FLOW (HIGHEST PRIORITY)
     */
    if (session.order && session.order.step) {
      response = await menuIntegration.handleOrder(from, cleanText);
      if (response) {
        const normalized = normalizeResponse(response);
        logChat({ userId: from, message: cleanText, response: normalized });
        return normalized;
      }
    }

    /**
     * 3. MENU SYSTEM
     */
    response = await menuIntegration.handleMenu(from, cleanText);
    if (response) {
      const normalized = normalizeResponse(response);
      logChat({ userId: from, message: cleanText, response: normalized });
      return normalized;
    }

    /**
     * 4. SEARCH MODULE
     */
    response = await searchIntegration.handleSearch(from, cleanText);
    if (response) {
      const normalized = normalizeResponse(response);
      logChat({ userId: from, message: cleanText, response: normalized });
      return normalized;
    }

    /**
     * 5. AI FALLBACK
     */
    response = await aiIntegration.handleAI(from, cleanText);
    if (response) {
      const normalized = normalizeResponse(response);
      logChat({ userId: from, message: cleanText, response: normalized });
      return normalized;
    }

    /**
     * DEFAULT RESPONSE
     */
    const defaultResponse = normalizeResponse({
      type: "text",
      message: "Invalid input. Please try again.",
      metadata: { screen: "invalid_input" }
    });

    logChat({ userId: from, message: cleanText, response: defaultResponse });

    return defaultResponse;

  } catch (error) {
    logError("pipeline", error);

    return {
      type: "text",
      message: "System error. Please try again later.",
      metadata: {
        screen: "pipeline_error"
      }
    };
  }
}

module.exports = { run };
