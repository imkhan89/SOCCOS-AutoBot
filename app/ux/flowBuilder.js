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

// State Manager
const {
  getState,
  updateState,
  setScreen,
  setProduct,
  setQuery
} = require("./stateManager");

/**
 * Main Flow Builder
 */
function buildFlow(userId, intent = {}) {
  try {
    const { type, payload = {} } = intent;

    const state = getState(userId);

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
        const query = payload.query;

        setQuery(userId, query);
        setScreen(userId, "search_results");

        // NOTE: No real DB yet → mock empty or sample
        const results = mockSearch(query);

        if (!results.length) {
          return emptyResults(query);
        }

        return searchResults({ query, results });
      }

      // ---------------- VIEW PRODUCT ----------------
      case "view_product": {
        const productId = payload.productId;

        const product = mockProduct(productId);

        if (!product) return fallbackMessage();

        setProduct(userId, productId);
        setScreen(userId, "product_card");

        return productCard(product);
      }

      // ---------------- PRODUCT DETAILS ----------------
      case "product_details": {
        const productId = payload.productId;

        const product = mockProduct(productId);

        if (!product) return fallbackMessage();

        setProduct(userId, productId);
        setScreen(userId, "product_details");

        return productDetails(product);
      }

      // ---------------- ORDER ----------------
      case "order_product": {
        const productId = payload.productId;

        const product = mockProduct(productId);

        if (!product) return fallbackMessage();

        setProduct(userId, productId);
        setScreen(userId, "product_actions");

        return productActions(product);
      }

      case "confirm_order": {
        setScreen(userId, "order_confirmed");

        return {
          type: "text",
          message: "✅ Your order has been placed! Our team will contact you shortly.",
          meta: { screen: "order_confirmed" }
        };
      }

      // ---------------- SUPPORT ----------------
      case "support":
        return {
          type: "text",
          message: "💬 Our support team will assist you shortly. Please describe your issue.",
          meta: { screen: "support" }
        };

      // ---------------- FALLBACK ----------------
      case "unknown":
        return invalidInput(payload.input);

      default:
        return fallbackMessage();
    }

  } catch (error) {
    return fallbackMessage();
  }
}

---

# 🧪 Mock Data (Temporary — Replace Later)

function mockSearch(query) {
  if (!query) return [];

  return [
    { id: "101", name: "Suzuki Mehran Air Filter", price: 1200, stock: 5 },
    { id: "102", name: "Suzuki Alto Oil Filter", price: 900, stock: 3 },
    { id: "103", name: "Honda Civic Cabin Filter", price: 1800, stock: 2 }
  ];
}

function mockProduct(id) {
  if (!id) return null;

  return {
    id,
    name: "Sample Auto Part",
    price: 1500,
    originalPrice: 2000,
    discount: 25,
    stock: 3,
    description: "High quality genuine auto part with perfect fit."
  };
}

module.exports = {
  buildFlow
};
