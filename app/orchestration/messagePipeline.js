/**
 * SOCCOS-AutoBot
 * PIPELINE (FINAL — HARD FIX STATE + FLOW)
 */

const shopifyClient = require("../../integrations/shopifyClient");
const sessionMemory = require("../../data/memory/sessionMemory");
const { trackEvent } = require("../../utils/tracker");

async function messagePipeline({ from, text }) {
  try {
    console.log("🔥 Pipeline triggered", { from, text });

    if (!from || !text) return null;

    text = text.trim().toLowerCase();

    let session = sessionMemory.getSession(from) || {};

    /**
     * 🚨 HARD FIX — FORCE ORDER CONTEXT
     */
    if (!session.order && session.lastSelectedProduct) {
      session.order = {
        step: "awaiting_name",
        product: session.lastSelectedProduct,
      };
    }

    /**
     * 🚨 PRIORITY — ORDER FLOW
     */
    if (session.order && session.order.step) {
      return {
        type: "text",
        message: await handleOrderFlow(from, text),
      };
    }

    /**
     * MENU
     */
    if (session.mode === "menu") {
      return await handleMenuFlow(from, text);
    }

    /**
     * SEARCH / SELECTION
     */
    if (session.mode === "search") {
      if (/^\d+$/.test(text)) {
        return await handleSelection(from, text);
      }
      return await handleSearch(from, text);
    }

    /**
     * SUPPORT
     */
    if (session.mode === "support") {
      return {
        type: "text",
        message: "Support request received.",
      };
    }

    /**
     * DEFAULT ENTRY
     */
    if (["hi", "hello", "start"].includes(text)) {
      sessionMemory.updateSession(from, { mode: "menu" });

      trackEvent("conversation_started", { user: from });

      return {
        type: "text",
        message:
          "👋 Welcome to NDES AutoBot!\n\n" +
          "1️⃣ Search Products\n" +
          "2️⃣ Support\n\nReply with option number",
      };
    }

    sessionMemory.updateSession(from, { mode: "search" });
    return await handleSearch(from, text);

  } catch (error) {
    console.error("❌ Pipeline Error:", error.message);
    return { type: "text", message: "System error." };
  }
}

/**
 * MENU
 */
async function handleMenuFlow(userId, text) {
  if (text === "1") {
    sessionMemory.updateSession(userId, { mode: "search" });
    return { type: "text", message: "🔍 Enter product name" };
  }

  if (text === "2") {
    sessionMemory.updateSession(userId, { mode: "support" });
    return { type: "text", message: "Describe your issue" };
  }

  return { type: "text", message: "Invalid option" };
}

/**
 * SEARCH
 */
async function handleSearch(userId, text) {
  const results = await shopifyClient.searchProducts(text);

  if (!results?.length) {
    return { type: "text", message: "No products found" };
  }

  const limited = results.slice(0, 5);

  sessionMemory.updateSession(userId, {
    mode: "search",
    lastResults: limited,
  });

  trackEvent("search", { user: userId, query: text });

  const msg = limited
    .map((p, i) => `${i + 1}. ${p.title} - Rs ${p.variants?.[0]?.price}`)
    .join("\n");

  return {
    type: "text",
    message: `🔎 Products:\n\n${msg}\n\nReply with number`,
  };
}

/**
 * SELECTION (CRITICAL FIX)
 */
async function handleSelection(userId, text) {
  const session = sessionMemory.getSession(userId) || {};
  const results = session.lastResults || [];

  const index = parseInt(text) - 1;

  if (!results[index]) {
    return { type: "text", message: "Invalid selection" };
  }

  const product = results[index];

  /**
   * 🚨 SAVE HARD STATE
   */
  sessionMemory.updateSession(userId, {
    lastSelectedProduct: product, // 🔥 NEW
    order: {
      step: "awaiting_name",
      product,
    },
  });

  trackEvent("product_selected", { user: userId });

  return {
    type: "image",
    image: product.image?.src || product.images?.[0]?.src,
    caption:
      `🛒 ${product.title}\n` +
      `Reply 0 to continue`,
  };
}

/**
 * ORDER FLOW
 */
async function handleOrderFlow(userId, text) {
  let session = sessionMemory.getSession(userId) || {};
  let order = session.order;

  if (!order) return null;

  if (order.step === "awaiting_name") {
    if (["0", "1", "2"].includes(text)) {
      return "Enter your name:";
    }

    sessionMemory.updateSession(userId, {
      order: { ...order, step: "awaiting_address", name: text },
    });

    return "Enter your address:";
  }

  if (order.step === "awaiting_address") {
    sessionMemory.updateSession(userId, {
      order: { ...order, step: "confirm_order", address: text },
    });

    return "Confirm order? 1 Yes / 2 No";
  }

  if (order.step === "confirm_order") {
    if (text === "1") {
      const orderRes = await shopifyClient.createOrder(order);

      sessionMemory.updateSession(userId, { order: null, mode: "menu" });

      return `✅ Order Confirmed ID: ${orderRes.id}`;
    }

    if (text === "2") {
      sessionMemory.updateSession(userId, { order: null, mode: "menu" });
      return "Order cancelled";
    }
  }

  return null;
}

module.exports = messagePipeline;
