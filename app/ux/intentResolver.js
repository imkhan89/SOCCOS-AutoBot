/**
 * INTENT RESOLVER — PRODUCTION FIXED
 * ---------------------------------
 * - Supports WhatsApp button IDs (CRITICAL)
 * - Strong state-based routing
 * - Clean separation of navigation vs search
 */

const { getState } = require("./stateManager");

function resolveIntent(input = "", userId = null) {
  if (!input || typeof input !== "string") {
    return buildIntent("unknown");
  }

  const text = normalize(input);

  /**
   * 🔥 PRIORITY 1: DIRECT BUTTON IDS (CRITICAL FIX)
   */
  if (text === "main_menu") return buildIntent("main_menu");
  if (text === "browse_categories") return buildIntent("browse_categories");
  if (text === "search_product") return buildIntent("search_product");
  if (text === "talk_support") return buildIntent("support");
  if (text === "chat_support") return buildIntent("support");

  /**
   * 🔥 PRIORITY 2: STATE-BASED OVERRIDE
   */
  if (userId) {
    const state = getState(userId);

    if (state?.screen === "awaiting_search_input") {
      return buildIntent("search", { query: text });
    }
  }

  /**
   * 🔥 PRIORITY 3: GREETING / NAVIGATION
   */
  if (isGreeting(text)) return buildIntent("main_menu");

  if (includesAny(text, ["menu", "start", "home"])) {
    return buildIntent("main_menu");
  }

  if (includesAny(text, ["category", "categories", "browse"])) {
    return buildIntent("browse_categories");
  }

  /**
   * 🔍 MANUAL SEARCH TRIGGER (TEXT BASED)
   */
  if (includesAny(text, ["search product", "search"])) {
    return buildIntent("search_product");
  }

  /**
   * 🔥 PRIORITY 4: PRODUCT ACTION IDS
   */
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

  /**
   * 🛟 SUPPORT
   */
  if (includesAny(text, ["help", "support", "agent"])) {
    return buildIntent("support");
  }

  /**
   * 🔍 FINAL: SAFE SEARCH DETECTION
   * Only trigger search if NOT navigation
   */
  if (isSearchQuery(text)) {
    return buildIntent("search", { query: text });
  }

  /**
   * ❌ FALLBACK
   */
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
    "search", "search product",
    "main_menu", "browse_categories",
    "search_product", "talk_support"
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
