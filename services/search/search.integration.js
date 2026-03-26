/**
 * SAE-V2 SEARCH INTEGRATION (FINAL - DATA SAFE + SCHEMA COMPLIANT)
 * --------------------------------
 * Handles:
 * - Product search
 * - Session storage
 * - Returns UI-safe response (no UI templates)
 */

const productSearch = require("./productSearch");
const sessionMemory = require("../../data/memory/sessionMemory");

/**
 * 🧾 NORMALIZE RESPONSE
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

async function handleSearch(userId, text = "") {
  try {
    if (!userId) return null;

    const session = sessionMemory.getSession(userId) || {};

    // Only trigger in search mode
    if (session.currentMenu !== "search") return null;

    // Ignore numeric input (handled elsewhere)
    if (/^\d+$/.test(text)) return null;

    const query = String(text || "").trim();
    if (!query) {
      return normalizeResponse({
        type: "text",
        message: "Please enter a valid product name",
        metadata: { screen: "search_input" }
      });
    }

    const results = await productSearch.search(query);
    const safeResults = Array.isArray(results) ? results : [];
    const limited = safeResults.slice(0, 5);

    sessionMemory.updateSession(userId, {
      lastResults: limited
    });

    if (!limited.length) {
      return normalizeResponse({
        type: "text",
        message: "No products found",
        metadata: {
          screen: "search_results",
          query,
          resultCount: 0
        }
      });
    }

    const message = limited
      .map((p, i) => {
        const title = p?.title || "Product";
        const price = p?.variants?.[0]?.price || "";
        return `${i + 1}. ${title} - Rs ${price}`;
      })
      .join("\n");

    return normalizeResponse({
      type: "text",
      message,
      metadata: {
        screen: "search_results",
        query,
        resultCount: safeResults.length
      }
    });

  } catch (error) {
    return normalizeResponse({
      type: "text",
      message: "Search error",
      metadata: {
        screen: "search_error"
      }
    });
  }
}

module.exports = {
  handleSearch
};
