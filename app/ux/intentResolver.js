/**
 * INTENT RESOLVER — UPDATED (WITH SEARCH STATE SUPPORT)
 * -----------------------------------------------------
 * - Fixes invalid input issue after "Search Product"
 * - Supports state-based intent override
 */

const { getState } = require("./stateManager");

function resolveIntent(input = "", userId = null) {
  if (!input || typeof input !== "string") {
    return buildIntent("unknown");
  }

  const text = normalize(input);

  /**
   * 🔥 NEW: STATE-BASED OVERRIDE (CRITICAL FIX)
   */
  if (userId) {
    const state = getState(userId);

    if (state?.screen === "awaiting_search_input") {
      return buildIntent("search", { query: text });
    }
  }

  // ---- Navigation Intents ----
  if (isGreeting(text)) return buildIntent("main_menu");

  if (includesAny(text, ["menu", "start", "home"])) {
    return buildIntent("main_menu");
  }

  if (includesAny(text, ["category", "categories", "browse"])) {
    return buildIntent("browse_categories");
  }

  /**
   * 🔍 EXPLICIT SEARCH BUTTON (IMPORTANT)
   */
  if (includesAny(text, ["search product", "search"])) {
    return buildIntent("search_product");
  }

  // ---- Search Intent ----
  if (isSearchQuery(text)) {
    return buildIntent("search", { query: text });
  }

  // ---- Product Interaction ----
  if (text.startsWith("view_")) {
    return buildIntent("view_product", { productId: extractId(text) });
  }

  if (text.startsWith("details_")) {
    return buildIntent("product_details", { productId: extractId(text) });
  }

  if (text.startsWith("order_")) {
    return buildIntent("order_product", { productId: extractId(text) });
  }

  if (text.startsWith("confirm_")) {
    return buildIntent("confirm_order", { productId: extractId(text) });
  }

  // ---- Support ----
  if (includesAny(text, ["help", "support", "agent"])) {
    return buildIntent("support");
  }

  // ---- Fallback ----
  return buildIntent("unknown", { input });
}

// -------------------- Helpers --------------------

function normalize(text) {
  return text.toLowerCase().trim();
}

function includesAny(text, keywords = []) {
  return keywords.some((k) => text.includes(k));
}

function isGreeting(text) {
  return includesAny(text, ["hi", "hello", "aoa", "assalam"]);
}

function isSearchQuery(text) {
  if (text.length < 3) return false;

  const blocked = [
    "hi", "hello", "menu", "start",
    "category", "browse", "help",
    "search", "search product"
  ];

  return !blocked.includes(text);
}

function extractId(text) {
  return text.split("_")[1] || null;
}

function buildIntent(type, payload = {}) {
  return {
    type,
    payload
  };
}

module.exports = {
  resolveIntent
};
