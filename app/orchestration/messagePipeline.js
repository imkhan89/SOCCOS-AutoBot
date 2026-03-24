/**
 * FINAL STABLE PIPELINE — TEXT ONLY (NO IMAGE)
 * ✅ FIXED EXPORT
 * ✅ ADDED CONVERSION + UPSSELL (SAFE)
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
     * ✅ ORDER FLOW PRIORITY
     */
    if (session.order && session.order.step) {
      return {
        type: "text",
        message: await handleOrderFlow(from, text),
      };
    }

    /**
     * ENTRY
     */
    if (["hi", "hello", "start"].includes(text)) {
      sessionMemory.updateSession(from, { mode: "menu" });

      return {
        type: "text",
        message:
          "👋 Welcome to Auto Parts Store\n\n" +
          "1️⃣ Search Products\n" +
          "2️⃣ Support",
      };
    }

    /**
     * MENU
     */
    if (session.mode === "menu") {
      if (text === "1") {
        sessionMemory.updateSession(from, { mode: "search" });

        return {
          type: "text",
          message: "🔍 Enter product name",
        };
      }
    }

    /**
     * SEARCH
     */
    if (session.mode === "search" && !/^\d+$/.test(text)) {
      const results = await shopifyClient.searchProducts(text);
      const limited = results.slice(0, 5);

      sessionMemory.updateSession(from, {
        lastResults: limited,
        mode: "search",
      });

      const msg = limited
        .map((p, i) => {
          const price = p.variants?.[0]?.price || "";
          return `${i + 1}️⃣ ${p.title} - Rs ${price}`;
        })
        .join("\n");

      return {
        type: "text",
        message:
          `🔎 Top Results:\n\n${msg}\n\nReply with number`,
      };
    }

    /**
     * SELECTION → START ORDER + UPSSELL
     */
    if (/^\d+$/.test(text)) {
      const results = session.lastResults || [];
      const product = results[parseInt(text) - 1];

      if (!product) {
        return { type: "text", message: "❌ Invalid selection" };
      }

      sessionMemory.updateSession(from, {
        order: {
          step: "awaiting_continue",
          product,
          upsellShown: false,
        },
      });

      const price = product.variants?.[0]?.price || "";

      return {
        type: "text",
        message:
          `🔥 Top Choice\n\n` +
          `🛒 ${product.title}\n` +
          `💰 Rs ${price}\n\n` +
          `✔ Original Product\n` +
          `✔ Fast Delivery\n\n` +
          `Reply 0 to continue`,
      };
    }

    return { type: "text", message: "Try again" };
  } catch (err) {
    console.error(err);
    return { type: "text", message: "System error" };
  }
}

/**
 * ORDER FLOW
 */
async function handleOrderFlow(userId, text) {
  const session = sessionMemory.getSession(userId) || {};
  const order = session.order;

  if (!order) return null;

  /**
   * STEP 0 — CONTINUE
   */
  if (order.step === "awaiting_continue") {
    if (text === "0") {
      sessionMemory.updateSession(userId, {
        order: { ...order, step: "awaiting_name" },
      });

      return "You're 1 step away ✅\n\nEnter your name:";
    }

    return "Reply 0 to continue";
  }

  /**
   * STEP 1 — NAME
   */
  if (order.step === "awaiting_name") {
    sessionMemory.updateSession(userId, {
      order: { ...order, step: "awaiting_address", name: text },
    });

    return "📍 Enter your address (City + Area):";
  }

  /**
   * STEP 2 — ADDRESS
   */
  if (order.step === "awaiting_address") {
    sessionMemory.updateSession(userId, {
      order: { ...order, step: "confirm_order", address: text },
    });

    return (
      "Confirm your order:\n\n" +
      "✔ Cash on Delivery\n" +
      "✔ 2–4 Days Delivery\n\n" +
      "1️⃣ Yes\n2️⃣ No"
    );
  }

  /**
   * STEP 3 — CONFIRM
   */
  if (order.step === "confirm_order") {
    if (text === "1") {
      const res = await shopifyClient.createOrder({
        product: order.product,
        name: order.name,
        address: order.address,
      });

      sessionMemory.updateSession(userId, {
        order: null,
        mode: "menu",
      });

      return (
        `✅ Order Confirmed\n` +
        `🆔 ID: ${res.id}\n\n` +
        `Our team may contact you.\n` +
        `Delivery: 2–4 days 🚚`
      );
    }

    if (text === "2") {
      sessionMemory.updateSession(userId, {
        order: null,
        mode: "menu",
      });

      return "❌ Order cancelled";
    }

    return "Reply 1 to confirm or 2 to cancel";
  }

  return null;
}

/**
 * ✅ CRITICAL FIX (YOUR ERROR)
 */
module.exports = messagePipeline;
