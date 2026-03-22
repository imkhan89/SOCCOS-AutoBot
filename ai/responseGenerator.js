/**
 * SOCCOS-AutoBot
 * Response Generator (FINAL - FIXED)
 */

async function responseGenerator(intent, data, originalText) {
  try {
    /**
     * SEARCH RESPONSE
     */
    if (intent === "search") {
      if (!Array.isArray(data) || data.length === 0) {
        return "❌ No products found. Try a different keyword.";
      }

      const message = data
        .map((item, i) => {
          const name =
            (item && (item.title || item.name)) || "Product";

          const price =
            item && item.price ? ` - Rs ${item.price}` : "";

          return `${i + 1}. ${name}${price}`;
        })
        .filter(Boolean)
        .join("\n")
        .trim();

      return message || "No products available.";
    }

    /**
     * GREETING
     */
    if (intent === "greeting") {
      return "👋 Welcome to NDES AutoBot!\nType product name to search.";
    }

    /**
     * MENU
     */
    if (intent === "menu") {
      return "📋 Menu:\n1. Search products\n2. Support";
    }

    /**
     * SUPPORT
     */
    if (intent === "support") {
      return "🤝 Please describe your issue. Our team will assist.";
    }

    /**
     * ORDER SELECT (fallback handled in pipeline)
     */
    if (intent === "order_select") {
      return "Processing your selection...";
    }

    /**
     * DEFAULT
     */
    return "Type product name (e.g., Civic brake pads)";

  } catch (error) {
    console.error("❌ ResponseGenerator Error:", error.message);
    return "System error. Please try again.";
  }
}

module.exports = responseGenerator;
