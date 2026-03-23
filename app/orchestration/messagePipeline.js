/**
 * SOCCOS-AutoBot
 * PIPELINE (FINAL — REVENUE + TRACKING + FIXED FLOW)
 */

const shopifyClient = require("../../integrations/shopifyClient");
const sessionMemory = require("../../data/memory/sessionMemory");
const { trackEvent } = require("../../utils/tracker");

async function messagePipeline({ from, text }) {
  try {
    console.log("🔥 Pipeline triggered", { from, text });

    if (!from || !text) return null;

    text = text.trim().toLowerCase();

    const session = sessionMemory.getSession(from) || {};

    /**
     * ✅ FIX — HANDLE UPSELL STEP FIRST
     */
    if (session.order && session.order.step === "awaiting_name") {
      if (text === "0") {
        return {
          type: "text",
          message: "Enter your name:",
        };
      }

      if (text === "1" || text === "2") {
        return {
          type: "text",
          message: "✅ Added to your order.\n\nEnter your name:",
        };
      }
    }

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
     * DEFAULT ENTRY
     */
    if (text === "hi" || text === "hello" || text === "start") {
      sessionMemory.updateSession(from, { mode: "menu" });

      trackEvent("conversation_started", { user: from });

      return {
        type: "text",
        message:
          "👋 Welcome to NDES AutoBot!\n\n" +
          "1️⃣ Search Products\n" +
          "2️⃣ Support\n\n" +
          "Reply with option number",
      };
    }

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
 * SEARCH
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

    const limitedResults = results.slice(0, 5);

    sessionMemory.updateSession(userId, {
      mode: "search",
      lastResults: limitedResults,
    });

    trackEvent("search", {
      user: userId,
      query: text,
      results: limitedResults.length,
    });

    const message = limitedResults
      .map((p, i) => {
        const price = p.variants?.[0]?.price || "";
        return `${i + 1}. ${p.title} - Rs ${price}`;
      })
      .join("\n");

    return {
      type: "text",
      message:
        `🔎 Top Products:\n\n${message}\n\nReply with number.`,
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
 * SELECTION
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
  const price = product.variants?.[0]?.price || "";

  trackEvent("product_selected", {
    user: userId,
    product: product.title,
    price,
  });

  trackEvent("order_started", {
    user: userId,
    product: product.title,
  });

  sessionMemory.updateSession(userId, {
    order: {
      step: "awaiting_name",
      product,
    },
  });

  const image =
    product.image?.src || product.images?.[0]?.src || null;

  const caption =
    `🛒 ${product.title}\n` +
    `💰 Rs ${price}\n\n` +
    `🔥 Frequently Bought:\n` +
    `1. Brake Cleaner - Rs 850\n` +
    `2. Engine Oil - Rs 4500\n\n` +
    `Reply:\n0 → Continue\n1/2 → Add item\n\n`;

  if (image) {
    return {
      type: "image",
      image,
      caption,
    };
  }

  return {
    type: "text",
    message: caption,
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
    sessionMemory.updateSession(userId, {
      order: {
        ...order,
        step: "confirm_order",
        address: text,
      },
    });

    return (
      `Please confirm your order:\n\n` +
      `Product: ${order.product.title}\n` +
      `Price: Rs ${order.product.variants?.[0]?.price}\n` +
      `Name: ${order.name}\n` +
      `Address: ${text}\n\n` +
      `Reply:\n1 → Confirm\n2 → Cancel`
    );
  }

  if (order.step === "confirm_order") {
    if (text === "1") {
      try {
        const shopifyOrder = await shopifyClient.createOrder({
          name: order.name,
          address: order.address,
          product: order.product,
        });

        sessionMemory.updateSession(userId, {
          mode: "menu",
          order: null,
        });

        trackEvent("order_confirmed", {
          user: userId,
          orderId: shopifyOrder.id,
          product: order.product.title,
        });

        return (
          `✅ Order Confirmed!\n\n` +
          `🆔 Order ID: ${shopifyOrder.id}\n` +
          `📦 Delivery: 2–4 days\n\n` +
          `Thank you for choosing NDES 🚗`
        );

      } catch (error) {
        console.error("Order Error:", error.message);
        return "❌ Order failed. Try again.";
      }
    }

    if (text === "2") {
      trackEvent("drop_off", {
        user: userId,
        step: "confirm_order_cancelled",
      });

      sessionMemory.updateSession(userId, {
        mode: "menu",
        order: null,
      });

      return "❌ Order cancelled.\n\n1️⃣ Search\n2️⃣ Support";
    }

    return "Reply 1 to Confirm or 2 to Cancel";
  }

  return null;
}

module.exports = messagePipeline;
