/**
 * FLOW BUILDER — UPDATED (CONTROLLED + CLEAN UX LAYER)
 */

// UI
const mainMenu = require("../../interface/ui/menu/mainMenu");
const categoryMenu = require("../../interface/ui/menu/categoryMenu");

const searchResults = require("../../interface/ui/search/searchResults");
const emptyResults = require("../../interface/ui/search/emptyResults");

const productCard = require("../../interface/ui/product/productCard");
const productDetails = require("../../interface/ui/product/productDetails");
const productActions = require("../../interface/ui/product/productActions");

const fallbackMessage = require("../../interface/ui/error/fallbackMessage");
const invalidInput = require("../../interface/ui/error/invalidInput");

// Services
const { search } = require("../../services/search/productSearch");
const { getProduct } = require("../../services/product/getProduct");

// State
const {
  getState,
  setScreen,
  setProduct,
  setQuery
} = require("./stateManager");

/**
 * MAIN FLOW
 */
async function buildFlow(userId, intent = {}, context = {}) {
  try {
    if (!userId) return fallbackMessage();

    const type = intent?.type || "unknown";
    const payload = intent?.payload || {};

    const input =
      payload?.query ||
      context?.text ||
      "";

    const state = getState(userId);

    // 🔒 STATE OVERRIDE (SEARCH MODE LOCK)
    if (
      state?.screen === "awaiting_search_input" &&
      type !== "search_product" &&
      input
    ) {
      return await handleSearch(userId, input);
    }

    switch (type) {

      case "main_menu":
        setScreen(userId, "main_menu");
        return mainMenu();

      case "browse_categories":
        setScreen(userId, "category_menu");
        return categoryMenu();

      case "search_product":
        setScreen(userId, "awaiting_search_input");

        return {
          type: "text",
          message: "What product are you looking for?",
          meta: { screen: "awaiting_search_input" }
        };

      case "search":
        return await handleSearch(userId, input);

      case "view_product": {
        const productId = payload?.productId;
        if (!productId) return fallbackMessage();

        const product = await getProduct({ id: productId });
        if (!product) return fallbackMessage();

        setProduct(userId, productId);
        setScreen(userId, "product_card");

        return productCard(product);
      }

      case "product_details": {
        const productId = payload?.productId;
        if (!productId) return fallbackMessage();

        const product = await getProduct({ id: productId });
        if (!product) return fallbackMessage();

        setProduct(userId, productId);
        setScreen(userId, "product_details");

        return productDetails(product);
      }

      case "order_product": {
        const productId = payload?.productId;
        if (!productId) return fallbackMessage();

        const product = await getProduct({ id: productId });
        if (!product) return fallbackMessage();

        setProduct(userId, productId);
        setScreen(userId, "product_actions");

        return productActions(product);
      }

      case "confirm_order":
        setScreen(userId, "order_confirmed");

        return {
          type: "text",
          message: "Your order has been placed. Our team will contact you shortly.",
          meta: { screen: "order_confirmed" }
        };

      case "support":
        setScreen(userId, "support");

        return {
          type: "text",
          message: "Our support team will assist you shortly. Please describe your issue.",
          meta: { screen: "support" }
        };

      case "unknown":
        return invalidInput(payload?.input);

      default:
        return fallbackMessage();
    }

  } catch (error) {
    return fallbackMessage();
  }
}

/**
 * 🔍 SEARCH HANDLER
 */
async function handleSearch(userId, query) {
  try {
    if (!query || query.length < 2) {
      return emptyResults("Please type a valid product name");
    }

    setQuery(userId, query);
    setScreen(userId, "search_results");

    const resultsRaw = await search(query);

    if (!Array.isArray(resultsRaw) || resultsRaw.length === 0) {
      return emptyResults(query);
    }

    const results = resultsRaw.slice(0, 10);

    return searchResults({ query, results });

  } catch (error) {
    return fallbackMessage();
  }
}

module.exports = {
  buildFlow
};
