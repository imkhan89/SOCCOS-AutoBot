/**
 * SEARCH RESULTS UI — FINAL (CONVERSION OPTIMIZED + WHATSAPP COMPLIANT)
 */

function searchResults({ query = "", results = [] } = {}) {
  if (!Array.isArray(results)) results = [];

  const topResults = results.slice(0, 10);

  /**
   * ❌ NO RESULTS (RECOVERY OPTIMIZED)
   */
  if (topResults.length === 0) {
    return {
      type: "interactive",
      message: `No products found for "${query}". Try again or browse categories.`,
      buttons: [
        { id: "search_product", title: "Search Again" },
        { id: "browse_categories", title: "Browse Categories" },
        { id: "support", title: "Talk to Support" }
      ],
      metadata: {
        screen: "search_results",
        query,
        resultCount: 0,
        funnel_step: "recovery"
      }
    };
  }

  /**
   * ✅ BUILD ROWS (HIGH CTR + WHATSAPP SAFE)
   */
  const rows = topResults
    .map((product, index) => {
      const safeId = sanitizeId(product?.id, index);
      if (!safeId) return null;

      return {
        id: `view_${safeId}`,
        title: truncate(product?.title || product?.name || "Product", 24),
        description: truncate(`Price: ${formatPrice(product?.price)}`, 72)
      };
    })
    .filter(Boolean)
    .slice(0, 10);

  /**
   * ⚠️ FAILSAFE
   */
  if (!rows.length) {
    return {
      type: "text",
      message: "Unable to display products. Please try again.",
      metadata: {
        screen: "search_results",
        query,
        resultCount: results.length,
        funnel_step: "error"
      }
    };
  }

  /**
   * ✅ RETURN LIST (CONVERSION PUSH)
   */
  return {
    type: "list",
    message: `Top results for "${query}"\n\nTap a product to view price & details`,
    sections: [
      {
        title: "Top Matches",
        rows
      }
    ],
    metadata: {
      screen: "search_results",
      query,
      resultCount: results.length,
      funnel_step: "consideration",
      intent: "product_selection"
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
  if (typeof text !== "string") text = String(text);
  if (text.length <= limit) return text;
  return text.substring(0, limit - 3) + "...";
}

module.exports = searchResults;
