/**
 * FINAL STABLE PIPELINE — REAL FIX
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
     * ✅ ORDER FLOW ONLY IF ORDER EXISTS
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
          "👋 Welcome\n\n1. Search Products\n2. Support",
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
          message: "Enter product name",
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
        .map((p, i) => `${i + 1}. ${p.title}`)
        .join("\n");

      return {
        type: "text",
        message: msg + "\n\nReply with number",
      };
    }

    /**
     * ✅ SELECTION (START ORDER PROPERLY)
     */
    if (/^\d+$/.test(text)) {
      const results = session.lastResults || [];
      const product = results[parseInt(text) - 1];

      if (!product) {
        return { type: "text", message: "Invalid selection" };
      }

      /**
       * 🚨 CRITICAL — SET ORDER STATE HERE
       */
      sessionMemory.updateSession(from, {
        order: {
          step: "awaiting_continue",
          product,
        },
      });

      return {
        type: "image",
        image: product.image?.src,
        caption:
          `🛒 ${product.title}\n\nReply 0 to continue`,
      };
    }

    return { type: "text", message: "Try again" };

  } catch (err) {
    console.error(err);
    return { type: "text", message: "Error" };
  }
}

/**
 * ORDER FLOW (STATEFUL — FIXED)
 */
async function handleOrderFlow(userId, text) {
  const session = sessionMemory.getSession(userId) || {};
  const order = session.order;

  if (!order) return null;

  /**
   * STEP 0 — CONTINUE
   */
  if (order.step === "awaiting_continue") {
    if (text === "0" || text === "1" || text === "2") {
      sessionMemory.updateSession(userId, {
        order: { ...order, step: "awaiting_name" },
      });

      return "Enter your name:";
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

    return "Enter your address:";
  }

  /**
   * STEP 2 — ADDRESS
   */
  if (order.step === "awaiting_address") {
    sessionMemory.updateSession(userId, {
      order: { ...order, step: "confirm_order", address: text },
    });

    return "Confirm order?\n1 Yes\n2 No";
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

      return `✅ Order Confirmed\nID: ${res.id}`;
    }

    if (text === "2") {
      sessionMemory.updateSession(userId, {
        order: null,
        mode: "menu",
      });

      return "Order cancelled";
    }

    return "Reply 1 to confirm or 2 to cancel";
  }

  return null;
}

module.exports = messagePipeline;
