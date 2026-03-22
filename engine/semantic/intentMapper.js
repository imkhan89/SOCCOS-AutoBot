/**
 * SOCCOS-AutoBot
 * Intent Mapper (FINAL - FIXED)
 */

function intentMapper(text = "") {
  try {
    const input = text
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!input) return "fallback";

    /**
     * ORDER SELECTION
     */
    if (/^\d+$/.test(input)) {
      return "order_select";
    }

    /**
     * SEARCH (HIGH PRIORITY)
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
     * MENU
     */
    if (input === "menu" || input === "options") {
      return "menu";
    }

    /**
     * SUPPORT
     */
    if (
      input === "help" ||
      input === "support" ||
      input.includes("problem")
    ) {
      return "support";
    }

    /**
     * GREETING (LOW PRIORITY)
     */
    if (
      input === "hi" ||
      input === "hello" ||
      input === "salam" ||
      input === "assalam"
    ) {
      return "greeting";
    }

    return "fallback";

  } catch (error) {
    console.error("IntentMapper Error:", error.message);
    return "fallback";
  }
}

module.exports = intentMapper;
