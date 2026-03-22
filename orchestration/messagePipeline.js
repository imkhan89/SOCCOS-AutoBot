/**
 * SOCCOS-AutoBot
 * CLEAN PIPELINE (FINAL)
 */

const intentMapper = require("../engine/semantic/intentMapper");
const queryProcessor = require("../engine/processors/queryProcessor");
const { searchProducts } = require("../search/searchService");
const responseGenerator = require("../ai/responseGenerator");
const whatsappService = require("../services/whatsappService");
const sessionMemory = require("../data/memory/sessionMemory");

/**
 * MAIN PIPELINE (ONLY ENTRY)
 */
async function messagePipeline({ from, text }) {
  try {
    /**
     * STEP 1 — ORDER FLOW FIRST (STATE MACHINE)
     */
    const orderResponse = await handleOrderFlow(from, text);
    if (orderResponse) {
      return await whatsappService.sendText(from, orderResponse);
    }

    /**
     * STEP 2 — INTENT DETECTION
     */
    const intent = intentMapper(text);

    /**
     * STEP 3 — ROUTING
     */
    if (intent === "menu") {
      return await whatsappService.sendText(
        from,
        "Welcome to NDES AutoBot.\nType product name to search."
      );
    }

    if (intent === "search") {
      return await handleSearch(from, text);
    }

    /**
     * DEFAULT FALLBACK
     */
    return await whatsappService.sendText(
      from,
      "Please type product name (e.g., Civic brake pads)"
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

    const results = await searchProducts(query);

    if (!results || results.length === 0) {
      return await whatsappService.sendText(
        userId,
        "No products found."
      );
    }

    /**
     * Save to session
     */
    sessionMemory.updateSession(userId, {
      lastResults: results,
    });

    /**
     * Convert to simple list text (NO UI COUPLING)
     */
    const message = results
      .map((item, i) => {
        const name = item.title || item.name || "Product";
        const price = item.price || "";
        return `${i + 1}. ${name} ${price ? `- Rs ${price}` : ""}`;
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

  const index = parseInt(text) - 1;

  if (!results[index]) {
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
 * ORDER FLOW (STATE MACHINE)
 */
async function handleOrderFlow(userId, text) {
  const session = sessionMemory.getSession(userId) || {};
  const order = session.order;

  if (!order || !order.step) {
    /**
     * Check if user is selecting product (number)
     */
    if (!isNaN(text)) {
      return await handleSelection(userId, text);
    }
    return null;
  }

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
