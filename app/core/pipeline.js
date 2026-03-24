/**
 * SAE-V2 CORE PIPELINE (LOGIC ONLY)
 * Orchestrator — NO UX, NO DIRECT LOGIC
 */

const sessionMemory = require("../../data/memory/sessionMemory");

// Integrations
const menuIntegration = require("../menus/menu.integration");
const searchIntegration = require("../../services/search/search.integration");
const aiIntegration = require("../../services/ai/ai.integration");
const middleware = require("../../services/middleware/middleware.integration");

module.exports = async function pipeline({ from, text }) {
  try {
    if (!from || !text) return null;

    // 1. PRE-PROCESS (middleware)
    const processed = await middleware.process({ from, text });

    const session = sessionMemory.getSession(from);

    // 2. ORDER FLOW PRIORITY
    if (session.order && session.order.step) {
      return await menuIntegration.handleOrder(from, processed.text);
    }

    // 3. MENU HANDLING
    const menuResponse = await menuIntegration.handleMenu(from, processed.text);
    if (menuResponse) return menuResponse;

    // 4. SEARCH
    const searchResponse = await searchIntegration.handleSearch(from, processed.text);
    if (searchResponse) return searchResponse;

    // 5. AI FALLBACK
    const aiResponse = await aiIntegration.handleAI(from, processed.text);
    if (aiResponse) return aiResponse;

    return {
      type: "text",
      message: "Invalid input. Try again.",
    };

  } catch (error) {
    console.error("❌ Pipeline Error:", error.message);
    return { type: "text", message: "System error" };
  }
};
