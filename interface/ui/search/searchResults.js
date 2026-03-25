/**
 * SEARCH RESULTS UI — FINAL FIXED (PRODUCTION SAFE)
 */

function searchResults({ query = "", results = [] } = {}) {
  if (!Array.isArray(results)) results = [];

  const topResults = results.slice(0, 10);

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
   * ✅ BUILD SAFE ROWS (CRITICAL FIX)
   */
  const rows = topResults
    .map((product, index) => {
      const safeId = sanitizeId(product.id, index);

      return {
        id: `view_${safeId}`, // ✅ ALWAYS SAFE
        title: truncate(product.title || product.name || "Product"),
        description: formatPrice(product.price)
      };
    })
    .filter(row => row.id); // extra safety

  /**
   * ⚠️ FAILSAFE
   */
  if (!rows.length) {
    return {
      type: "text",
      message: "⚠️ Unable to display products. Please try again."
    };
  }

  /**
   * ✅ RETURN LIST
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
 * 🔒 SANITIZE ID (CRITICAL FIX)
 */
function sanitizeId(id, fallbackIndex) {
  if (!id) return `fallback_${fallbackIndex}`;

  // Handle Shopify GID
  if (typeof id === "string" && id.includes("gid://")) {
    const parts = id.split("/");
    return parts[parts.length - 1];
  }

  return String(id);
}

/**
 * 💰 FORMAT PRICE
 */
function formatPrice(price) {
  const num = Number(price) || 0;
  return `PKR ${num}`;
}

/**
 * ✂️ TRUNCATE
 */
function truncate(text = "", limit = 24) {
  if (text.length <= limit) return text;
  return text.substring(0, limit - 3) + "...";
}

module.exports = searchResults;
