/**
 * SOCCOS-AutoBot
 * PIPELINE (STEP 6 — FINAL FIXED)
 */

const intentMapper = require("../../engine/semantic/intentMapper");
const queryProcessor = require("../../engine/processors/queryProcessor");
const { searchProducts } = require("../search/searchService");
const sessionMemory = require("../../data/memory/sessionMemory");

async function messagePipeline({ from, text }) {
  try {
    console.log("🔥 Pipeline triggered", { from, text });

    if (!from || !text) return null;

    const session = sessionMemory.getSession(from) || {};

    /**
     * STEP 1 — ORDER FLOW (PRIORITY)
     */
    const orderResponse = await handleOrderFlow(from, text);
    if (orderResponse) {
      return {
        type: "text",
        message: orderResponse,
      };
    }

    /**
     * STEP 2 — MODE CONTROL (FIXED)
     */
    if (session.mode === "menu") {
      return await handleMenuFlow(from, text);
    }

    if (session.mode === "search") {
      // 🔥 FIX: detect selection
      if (!isNaN(text)) {
        return await handleSelection(from, text);
      }

      return await handleSearch(from, text);
    }

    if (session.mode === "support") {
      return {
        type: "text",
        message: "Support request received. Our team will contact you.",
      };
    }

    /**
     * STEP 3 — INTENT
     */
    const intent = intentMapper(text);

    /**
     * STEP 4 — ROUTING
     */
    if (intent === "greeting") {
      sessionMemory.updateSession(from, { mode: "menu" });

      return {
        type: "text",
        message:
          "👋 Welcome to NDES AutoBot!\n\n" +
          "1️⃣ Search Products\n" +
          "2️⃣ Support\n\n" +
          "Reply with option number",
      };
    }

    if (intent === "order_select") {
      return await handleSelection(from, text);
    }

    if (intent === "search") {
      sessionMemory.updateSession(from, { mode: "search" });
      return await handleSearch(from, text);
    }

    /**
     * DEFAULT
     */
    return {
      type: "text",
      message:
        "Type 1 for Search or 2 for Support\n\n" +
        "Or type product name directly.",
    };

  } catch (error) {
    console.error("❌ Pipeline Error:", error.message);

    return {
      type: "text",
      message: "System error. Please try again.",
    };
  }
}

/**
 * MENU FLOW
 */
async function handleMenuFlow(userId, text) {
  if (text === "1") {
    sessionMemory.updateSession(userId, { mode: "search" });

    return {
      type: "text",
      message: "🔍 Enter product name (e.g., Civic brake pads)",
    };
  }

  if (text === "2") {
    sessionMemory.updateSession(userId, { mode: "support" });

    return {
      type: "text",
      message: "🤝 Please describe your issue.",
    };
  }

  return {
    type: "text",
    message:
      "Invalid option.\n\n" +
      "1️⃣ Search Products\n" +
      "2️⃣ Support",
  };
}

/**
 * SEARCH FLOW
 */
async function handleSearch(userId, text) {
  try {
    const query = queryProcessor(text);

    if (!query) {
      return {
        type: "text",
        message: "Please enter a valid product name.",
      };
    }

    const results = await searchProducts(query);

    if (!results || results.length === 0) {
      return {
        type: "text",
        message: "No products found.",
      };
    }

    sessionMemory.updateSession(userId, {
      mode: "search",
      lastResults: results,
    });

    const message = results
      .map((item, i) => {
        const name = item.title || item.name || "Product";
        const price = item.price ? `- Rs ${item.price}` : "";
        return `${i + 1}. ${name} ${price}`;
      })
      .join("\n");

    return {
      type: "text",
      message:
        `Available Products:\n\n${message}\n\nReply with number to select.`,
    };

  } catch (error) {
    console.error("Search Error:", error.message);

    return {
      type: "text",
      message: "Search error. Try again.",
    };
  }
}

/**
 * ORDER SELECTION
 */
async function handleSelection(userId, text) {
  const session = sessionMemory.getSession(userId) || {};
  const results = session.lastResults || [];

  const index = parseInt(text, 10) - 1;

  if (isNaN(index) || !results[index]) {
    return {
      type: "text",
      message: "Invalid selection.",
    };
  }

  const product = results[index];

  sessionMemory.updateSession(userId, {
    order: {
      step: "awaiting_name",
      product,
    },
  });

  return {
    type: "text",
    message: `Selected: ${product.title || product.name}\nEnter your name:`,
  };
}

/**
 * ORDER FLOW
 */
async function handleOrderFlow(userId, text) {
  const session = sessionMemory.getSession(userId) || {};
  const order = session.order;

  if (!order || !order.step) return null;

  if (order.step === "awaiting_name") {
    sessionMemory.updateSession(userId, {
      order: {
        ...order,
        step: "awaiting_address",
        name: text,
      },
    });

    return "Enter your address:";
  }

  if (order.step === "awaiting_address") {
    sessionMemory.clearSession(userId);
    return "✅ Order placed successfully!";
  }

  return null;
}

module.exports = messagePipeline;
