/**
 * SOCCOS-AutoBot
 * Response Generator (FINAL - SAFE & FLEXIBLE)
 * --------------------------------------------
 * INPUT: intent, data, originalText
 * OUTPUT: plain text response
 * NO WhatsApp formatting
 */

async function responseGenerator(intent, data, originalText) {
  try {
    /**
     * SEARCH RESPONSE
     */
    if (intent === "search") {
      if (!data || data.length === 0) {
        return "❌ No products found. Try a different keyword.";
      }

      return data
        .map((item, i) => {
          const name = item.title || item.name || "Product";
          const price = item.price ? `Rs ${item.price}` : "";
          return `${i + 1}. ${name} ${price}`;
        })
        .join("\n");
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
      return "🤝 Support: Please describe your issue and our team will assist.";
    }

    /**
     * DEFAULT FALLBACK
     */
    return "Type product name (e.g., Civic brake pads)";

  } catch (error) {
    console.error("❌ ResponseGenerator Error:", error.message);

    return "System error. Please try again.";
  }
}

module.exports = responseGenerator;
