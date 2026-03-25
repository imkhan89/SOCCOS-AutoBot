// app/ux/flowBuilder.js

// UI Imports
const mainMenu = require("../../interface/ui/menu/mainMenu");
const categoryMenu = require("../../interface/ui/menu/categoryMenu");

const searchResults = require("../../interface/ui/search/searchResults");
const emptyResults = require("../../interface/ui/search/emptyResults");

const productCard = require("../../interface/ui/product/productCard");
const productDetails = require("../../interface/ui/product/productDetails");
const productActions = require("../../interface/ui/product/productActions");

const recoveryMessage = require("../../interface/ui/recovery/recoveryMessage");
const recoveryReminder = require("../../interface/ui/recovery/recoveryReminder");

const fallbackMessage = require("../../interface/ui/error/fallbackMessage");
const invalidInput = require("../../interface/ui/error/invalidInput");

// ✅ REAL SERVICES (REPLACED MOCKS)
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
    const { cleanedMessage } = context;

    getState(userId); // ensure state exists

    switch (type) {

      // ---------------- MAIN MENU ----------------
      case "main_menu":
        setScreen(userId, "main_menu");
        return mainMenu();

      // ---------------- CATEGORY ----------------
      case "browse_categories":
        setScreen(userId, "category_menu");
        return categoryMenu();

      // ---------------- SEARCH ----------------
      case "search": {
        // ✅ PRIORITY: payload → fallback → cleanedMessage
        const query =
          payload.query ||
          cleanedMessage ||
          "";

        if (!query || query.length < 2) {
          return emptyResults("Please type a product name");
        }

        setQuery(userId, query);
        setScreen(userId, "search_results");

        const results = await search({ query });

        if (!results || !results.length) {
          return emptyResults(query);
        }

        return searchResults({ query, results });
      }

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
    return fallbackMessage();
  }
}

module.exports = {
  buildFlow
};
