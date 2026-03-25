/**
 * SEARCH RESULTS UI — FINAL (WHATSAPP SAFE)
 * ----------------------------------------
 * - Uses LIST instead of buttons
 * - Supports up to 10 products
 * - Prevents send errors
 */

function searchResults({ query = "", results = [] } = {}) {
  if (!Array.isArray(results)) results = [];

  const topResults = results.slice(0, 10); // ✅ WhatsApp safe limit

  /**
   * ❌ NO RESULTS
   */
  if (topResults.length === 0) {
    return {
      type: "text",
      message: `❌ No products found for "${query}".\n\nTry another keyword.`,
      meta: {
        screen: "search_results",
        query,
        resultCount: 0
      }
    };
  }

  /**
   * ✅ BUILD LIST ROWS
   */
  const rows = topResults.map((product) => ({
    id: `view_${product.id}`,
    title: truncate(product.title || product.name || "Product"),
    description: `PKR ${product.price || 0}`
  }));

  /**
   * ✅ RETURN WHATSAPP LIST
   */
  return {
    type: "list",
    header: "🔍 Search Results",
    body: `Results for "${query}"`,
    footer: "Select a product to view details",
    buttonText: "View Products",
    sections: [
      {
        title: "Available Products",
        rows
      }
    ],
    meta: {
      screen: "search_results",
      query,
      resultCount: results.length
    }
  };
}

/**
 * ✂️ TEXT TRUNCATION
 */
function truncate(text = "", limit = 24) {
  if (text.length <= limit) return text;
  return text.substring(0, limit - 3) + "...";
}

module.exports = searchResults;
