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
      metadata: {
        screen: "search_results",
        query,
        resultCount: 0
      }
    };
  }

  /**
   * ✅ BUILD SAFE ROWS
   */
  const rows = topResults
    .map((product, index) => {
      const safeId = sanitizeId(product?.id, index);

      if (!safeId) return null;

      return {
        id: `view_${safeId}`,
        title: truncate(product?.title || product?.name || "Product"),
        description: formatPrice(product?.price)
      };
    })
    .filter(Boolean);

  /**
   * ⚠️ FAILSAFE
   */
  if (!rows.length) {
    return {
      type: "text",
      message: "⚠️ Unable to display products. Please try again.",
      metadata: {
        screen: "search_results",
        query,
        resultCount: results.length
      }
    };
  }

  /**
   * ✅ RETURN LIST
   */
  return {
    type: "list",
    message: `🔍 *Search Results*

Results for "${query}"

Select a product to view details`,
    buttonText: "View Products",
    sections: [
      {
        title: "Available Products",
        rows
      }
    ],
    metadata: {
      screen: "search_results",
      query,
      resultCount: results.length
    }
  };
}

/**
 * 🔒 SANITIZE ID
 */
function sanitizeId(id, fallbackIndex) {
  if (!id) return `fallback_${fallbackIndex}`;

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
  const num = Number(price);
  if (!num) return "PKR 0";
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
