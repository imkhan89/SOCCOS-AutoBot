/**
 * SAE-V2 SEARCH INTEGRATION (FINAL)
 * --------------------------------
 * Handles:
 * - Product search
 * - Result formatting (no UI templates)
 * - Session storage
 */

const productSearch = require("./productSearch");
const sessionMemory = require("../../data/memory/sessionMemory");

async function handleSearch(userId, text) {
  try {
    const session = sessionMemory.getSession(userId);

    // Only trigger in search mode
    if (session.currentMenu !== "search") return null;

    // Ignore numeric input (handled by orderFlow)
    if (/^\d+$/.test(text)) return null;

    const results = await productSearch.search(text);
    const limited = results.slice(0, 5);

    sessionMemory.updateSession(userId, {
      lastResults: limited,
    });

    return {
      type: "text",
      message: limited
        .map((p, i) => {
          const price = p.variants?.[0]?.price || "";
          return `${i + 1}. ${p.title} - Rs ${price}`;
        })
        .join("\n") || "No products found",
    };

  } catch (error) {
    console.error("❌ Search Error:", error.message);
    return {
      type: "text",
      message: "Search error",
    };
  }
}

module.exports = {
  handleSearch,
};
