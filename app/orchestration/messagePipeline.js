/**
 * SOCCOS-AutoBot
 * PIPELINE (FINAL — CLEAN + STABLE)
 */

const shopifyClient = require("../../integrations/shopifyClient");
const sessionMemory = require("../../data/memory/sessionMemory");

async function messagePipeline({ from, text }) {
  try {
    console.log("🔥 Pipeline triggered", { from, text });

    if (!from || !text) return null;

    text = text.trim().toLowerCase();

    const session = sessionMemory.getSession(from) || {};

    /**
     * STEP 1 — ORDER FLOW (PRIORITY)
     */
    const orderResponse = await handleOrderFlow(from, text);
    if (orderResponse) {
      return { type: "text", message: orderResponse };
    }

    /**
     * STEP 2 — MODE CONTROL
     */
    if (session.mode === "menu") {
      return await handleMenuFlow(from, text);
    }

    if (session.mode === "search") {
      if (/^\d+$/.test(text)) {
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
     * STEP 3 — DEFAULT ENTRY (NO INTENT ENGINE)
     */
    if (text === "hi" || text === "hello" || text === "start") {
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

    // If user types anything → treat as search
    sessionMemory.updateSession(from, { mode: "search" });
    return await handleSearch(from, text);

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
      message: "🔍 Enter product name (e.g., brake pads)",
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
    message: "Invalid option.\n\n1️⃣ Search Products\n2️⃣ Support",
  };
}

/**
 * 🔍 SEARCH (DIRECT SHOPIFY — NO PROCESSOR)
 */
async function handleSearch(userId, text) {
  try {
    const results = await shopifyClient.searchProducts(text);

    if (!results || !results.length) {
      return {
        type: "text",
        message: "❌ No products found.",
      };
    }

    sessionMemory.updateSession(userId, {
      mode: "search",
      lastResults: results,
    });

    const message = results
      .map((p, i) => {
        const price = p.variants?.[0]?.price || "";
        return `${i + 1}. ${p.title} - Rs ${price}`;
      })
      .join("\n");

    return {
      type: "text",
      message:
        `🔎 Available Products:\n\n${message}\n\nReply with number.`,
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
 * SELECT PRODUCT
 */
async function handleSelection(userId, text) {
  const session = sessionMemory.getSession(userId) || {};
  const results = session.lastResults || [];

  const index = parseInt(text.trim(), 10) - 1;

  if (!results[index]) {
    return {
      type: "text",
      message: "❌ Invalid selection.",
    };
  }

  const product = results[index];

  sessionMemory.updateSession(userId, {
    order: {
      step: "awaiting_name",
      product,
    },
  });

  const price = product.variants?.[0]?.price || "";

  return {
    type: "text",
    message:
      `🛒 Selected:\n${product.title}\n💰 Rs ${price}\n\nEnter your name:`,
  };
}

/**
 * 🛒 ORDER FLOW
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
    try {
      const shopifyOrder = await shopifyClient.createOrder({
        name: order.name,
        address: text,
        product: order.product,
      });

      sessionMemory.updateSession(userId, { mode: "menu", order: null });

      if (!shopifyOrder) {
        return "❌ Order failed. Try again.";
      }

      return (
        `✅ Order Confirmed!\n` +
        `Order ID: ${shopifyOrder.id}\n` +
        `Product: ${order.product.title}\n\n` +
        `1️⃣ Search Products\n2️⃣ Support`
      );

    } catch (error) {
      console.error("Order Error:", error.message);
      return "❌ Order failed. Try again.";
    }
  }

  return null;
}

module.exports = messagePipeline;
