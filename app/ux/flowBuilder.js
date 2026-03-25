// app/ux/flowBuilder.js (FIXED — PRODUCTION SAFE)

// UI Imports
const mainMenu = require("../../interface/ui/menu/mainMenu");
const categoryMenu = require("../../interface/ui/menu/categoryMenu");

const searchResults = require("../../interface/ui/search/searchResults");
const emptyResults = require("../../interface/ui/search/emptyResults");

const productCard = require("../../interface/ui/product/productCard");
const productDetails = require("../../interface/ui/product/productDetails");
const productActions = require("../../interface/ui/product/productActions");

const fallbackMessage = require("../../interface/ui/error/fallbackMessage");
const invalidInput = require("../../interface/ui/error/invalidInput");

// SERVICES
const { search } = require("../../services/search/productSearch");
const { getProduct } = require("../../services/product/getProduct");

// State Manager
const {
  getState,
  setScreen,
  setProduct,
  setQuery
} = require("./stateManager");

/**
 * Main Flow Builder
 */
async function buildFlow(userId, intent = {}, context = {}) {
  try {
    const { type, payload = {} } = intent;

    // 🔥 SAFE INPUT EXTRACTION (FIX)
    const input =
      payload?.query ||
      context?.text ||
      "";

    const state = getState(userId);

    /**
     * 🔥 GLOBAL STATE OVERRIDE (CRITICAL SAFETY)
     */
    if (state?.screen === "awaiting_search_input" && type !== "search_product") {
      return await handleSearch(userId, input);
    }

    switch (type) {

      // ---------------- MAIN MENU ----------------
      case "main_menu":
        setScreen(userId, "main_menu");
        return mainMenu();

      // ---------------- CATEGORY ----------------
      case "browse_categories":
        setScreen(userId, "category_menu");
        return categoryMenu();

      /**
       * 🔍 SEARCH ENTRY (BUTTON OR TEXT)
       */
      case "search_product":
        setScreen(userId, "awaiting_search_input");

        return {
          type: "text",
          message: "🔍 What product are you looking for?",
          meta: { screen: "awaiting_search_input" }
        };

      /**
       * 🔍 DIRECT SEARCH (TEXT)
       */
      case "search":
        return await handleSearch(userId, input);

      // ---------------- VIEW PRODUCT ----------------
      case "view_product": {
        const productId = payload.productId;

        const product = await getProduct({ id: productId });
        if (!product) return fallbackMessage();

        setProduct(userId, productId);
        setScreen(userId, "product_card");

        return productCard(product);
      }

      // ---------------- PRODUCT DETAILS ----------------
      case "product_details": {
        const productId = payload.productId;

        const product = await getProduct({ id: productId });
        if (!product) return fallbackMessage();

        setProduct(userId, productId);
        setScreen(userId, "product_details");

        return productDetails(product);
      }

      // ---------------- ORDER ----------------
      case "order_product": {
        const productId = payload.productId;

        const product = await getProduct({ id: productId });
        if (!product) return fallbackMessage();

        setProduct(userId, productId);
        setScreen(userId, "product_actions");

        return productActions(product);
      }

      // ---------------- CONFIRM ----------------
      case "confirm_order":
        setScreen(userId, "order_confirmed");

        return {
          type: "text",
          message: "✅ Your order has been placed! Our team will contact you shortly.",
          meta: { screen: "order_confirmed" }
        };

      // ---------------- SUPPORT ----------------
      case "support":
        return {
          type: "text",
          message: "💬 Our support team will assist you shortly. Please describe your issue.",
          meta: { screen: "support" }
        };

      // ---------------- INVALID ----------------
      case "unknown":
        return invalidInput(payload.input);

      // ---------------- DEFAULT ----------------
      default:
        return fallbackMessage();
    }

  } catch (error) {
    console.error("❌ FlowBuilder Error:", error.message);
    return fallbackMessage();
  }
}

/**
 * 🔍 SEARCH HANDLER (ISOLATED — CLEAN ARCHITECTURE)
 */
async function handleSearch(userId, query) {
  try {
    if (!query || query.length < 2) {
      return emptyResults("Please type a valid product name");
    }

    setQuery(userId, query);
    setScreen(userId, "search_results");

    const resultsRaw = await search(query);

    if (!resultsRaw || !resultsRaw.length) {
      return emptyResults(query);
    }

    const results = resultsRaw.slice(0, 10);

    return searchResults({ query, results });

  } catch (error) {
    console.error("❌ Search Error:", error.message);
    return fallbackMessage();
  }
}

module.exports = {
  buildFlow
};
