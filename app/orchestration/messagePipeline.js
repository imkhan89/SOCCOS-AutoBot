/**
 * SOCCOS-AutoBot
 * PIPELINE (FINAL — REVENUE OPTIMIZED)
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
     * DEFAULT ENTRY
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
 * 🔍 SEARCH (LIMITED RESULTS)
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

    // ✅ LIMIT RESULTS (CRITICAL FIX)
    const limitedResults = results.slice(0, 5);

    sessionMemory.updateSession(userId, {
      mode: "search",
      lastResults: limitedResults,
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
 * SELECT PRODUCT (IMAGE + UPSELL)
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
    `Reply 0 to continue\n\n` +
    `Enter your name:`;

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
 * 🛒 ORDER FLOW (COD CONFIRMATION)
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

        if (!shopifyOrder) {
          return "❌ Order failed. Try again.";
        }

        return (
          `✅ Order Confirmed!\n\n` +
          `🆔 Order ID: ${shopifyOrder.id}\n` +
          `📦 Delivery: 2–4 days\n\n` +
          `Our team may call you for confirmation.\n\n` +
          `Thank you for choosing NDES 🚗`
        );

      } catch (error) {
        console.error("Order Error:", error.message);
        return "❌ Order failed. Try again.";
      }
    }

    if (text === "2") {
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
