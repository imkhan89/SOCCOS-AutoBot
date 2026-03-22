/**
 * SOCCOS-AutoBot
 * Intent Mapper (FINAL - CLEAN & CONSISTENT)
 * ------------------------------------------
 * INPUT: text
 * OUTPUT: intent (string only)
 * NO objects, NO confidence
 */

function intentMapper(text = "") {
  try {
    /**
     * NORMALIZE INPUT
     */
    const input = text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/gi, ""); // remove punctuation

    if (!input) return "fallback";

    /**
     * ORDER SELECTION (number input)
     */
    if (/^\d+$/.test(input)) {
      return "order_select";
    }

    /**
     * GREETING
     */
    if (
      input.includes("hi") ||
      input.includes("hello") ||
      input.includes("salam") ||
      input.includes("assalam")
    ) {
      return "greeting";
    }

    /**
     * MENU
     */
    if (
      input === "menu" ||
      input.includes("menu") ||
      input.includes("options")
    ) {
      return "menu";
    }

    /**
     * SUPPORT
     */
    if (
      input.includes("help") ||
      input.includes("support") ||
      input.includes("issue")
    ) {
      return "support";
    }

    /**
     * SEARCH (AUTOMOTIVE KEYWORDS)
     */
    const searchKeywords = [
      "price",
      "buy",
      "order",
      "brake",
      "pad",
      "filter",
      "oil",
      "plug",
      "tyre",
      "battery",
      "engine",
      "civic",
      "corolla"
    ];

    if (searchKeywords.some((word) => input.includes(word))) {
      return "search";
    }

    /**
     * DEFAULT FALLBACK
     */
    return "fallback";

  } catch (error) {
    console.error("IntentMapper Error:", error.message);
    return "fallback";
  }
}

module.exports = intentMapper;
