/**
 * SAE-V2 CORE PIPELINE (FINAL - HARDENED)
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

module.exports = async function pipeline({ from, text }) {
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

    const cleanText = (processed?.text || text || "").toString().trim().toLowerCase();

    if (!cleanText) {
      return {
        type: "text",
        message: "Please enter a valid input",
      };
    }

    const session = sessionMemory.getSession(from);

    /**
     * 2. ORDER FLOW (HIGHEST PRIORITY)
     */
    if (session.order && session.order.step) {
      const orderResponse = await menuIntegration.handleOrder(from, cleanText);
      if (orderResponse) return orderResponse;
    }

    /**
     * 3. MENU SYSTEM
     */
    const menuResponse = await menuIntegration.handleMenu(from, cleanText);
    if (menuResponse) return menuResponse;

    /**
     * 4. SEARCH MODULE
     */
    const searchResponse = await searchIntegration.handleSearch(from, cleanText);
    if (searchResponse) return searchResponse;

    /**
     * 5. AI FALLBACK
     */
    const aiResponse = await aiIntegration.handleAI(from, cleanText);
    if (aiResponse) return aiResponse;

    /**
     * DEFAULT RESPONSE
     */
    return {
      type: "text",
      message: "Invalid input. Please try again.",
    };

  } catch (error) {
    console.error("❌ Pipeline Error:", error.message);

    return {
      type: "text",
      message: "System error. Please try again later.",
    };
  }
};
