/**
 * SOCCOS-AutoBot
 * PRODUCTION PIPELINE (CORRECTED)
 */

const intentMapper = require("../../engine/semantic/intentMapper");
const queryProcessor = require("../../engine/processors/queryProcessor");
const { searchProducts } = require("../search/searchService");
const whatsappService = require("../../services/whatsappService");
const sessionMemory = require("../../data/memory/sessionMemory");

async function messagePipeline({ from, text }) {
  try {
    console.log("🔥 Pipeline triggered", { from, text });

    if (!from || !text) return;

    /**
     * STEP 1 — ORDER FLOW
     */
    const orderResponse = await handleOrderFlow(from, text);
    if (orderResponse) {
      return await whatsappService.sendText(from, orderResponse);
    }

    /**
     * STEP 2 — INTENT
     */
    const intent = intentMapper(text);

    /**
     * STEP 3 — ROUTING
     */
    if (intent === "greeting") {
      return await whatsappService.sendText(
        from,
        "👋 Welcome to NDES AutoBot!\nType product name to search."
      );
    }

    if (intent === "menu") {
      return await whatsappService.sendText(
        from,
        "📋 Menu:\n1. Search products\n2. Support"
      );
    }

    if (intent === "support") {
      return await whatsappService.sendText(
        from,
        "🤝 Please describe your issue. Our team will assist."
      );
    }

    if (intent === "order_select") {
      return await handleSelection(from, text);
    }

    if (intent === "search") {
      return await handleSearch(from, text);
    }

    /**
     * DEFAULT
     */
    return await whatsappService.sendText(
      from,
      "Type product name (e.g., Civic brake pads)"
    );

  } catch (error) {
    console.error("❌ Pipeline Error:", error.message);

    return await whatsappService.sendText(
      from,
      "System error. Please try again."
    );
  }
}

/**
 * SEARCH FLOW
 */
async function handleSearch(userId, text) {
  try {
    const query = queryProcessor(text);

    if (!query) {
      return await whatsappService.sendText(
        userId,
        "Please enter a valid product name."
      );
    }

    const results = await searchProducts(query);

    if (!results || results.length === 0) {
      return await whatsappService.sendText(
        userId,
        "No products found."
      );
    }

    sessionMemory.updateSession(userId, {
      lastResults: results,
    });

    const message = results
      .map((item, i) => {
        const name = item.title || item.name || "Product";
        const price = item.price ? `- Rs ${item.price}` : "";
        return `${i + 1}. ${name} ${price}`;
      })
      .join("\n");

    return await whatsappService.sendText(
      userId,
      `Available Products:\n\n${message}\n\nReply with number to select.`
    );

  } catch (error) {
    console.error("Search Error:", error.message);

    return await whatsappService.sendText(
      userId,
      "Search error. Try again."
    );
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
    return await whatsappService.sendText(userId, "Invalid selection.");
  }

  const product = results[index];

  sessionMemory.updateSession(userId, {
    order: {
      step: "awaiting_name",
      product,
    },
  });

  return await whatsappService.sendText(
    userId,
    `Selected: ${product.title || product.name}\nEnter your name:`
  );
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
