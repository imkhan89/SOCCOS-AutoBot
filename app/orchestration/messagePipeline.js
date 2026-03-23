/**
 * SOCCOS-AutoBot
 * PIPELINE (WORKING STABLE VERSION)
 */

const shopifyClient = require("../../integrations/shopifyClient");
const sessionMemory = require("../../data/memory/sessionMemory");

async function messagePipeline({ from, text }) {
  try {
    console.log("🔥 Pipeline triggered", { from, text });

    if (!from || !text) return null;

    text = text.trim();

    let session = sessionMemory.getSession(from) || {};

    /**
     * 🚨 HARD RULE — FORCE ORDER FLOW
     */
    if (
      session.lastSelectedProduct &&
      (!session.mode || session.mode === "search")
    ) {
      return {
        type: "text",
        message: await handleOrderFlow(from, text),
      };
    }

    /**
     * MENU
     */
    if (text.toLowerCase() === "hi") {
      sessionMemory.updateSession(from, { mode: "menu" });

      return {
        type: "text",
        message:
          "👋 Welcome\n\n1. Search Products\n2. Support",
      };
    }

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
     * SELECTION
     */
    if (/^\d+$/.test(text)) {
      const results = session.lastResults || [];
      const product = results[parseInt(text) - 1];

      if (!product) {
        return { type: "text", message: "Invalid" };
      }

      sessionMemory.updateSession(from, {
        lastSelectedProduct: product,
      });

      return {
        type: "image",
        image: product.image?.src,
        caption: `🛒 ${product.title}\nReply 0 to continue`,
      };
    }

    return { type: "text", message: "Try again" };

  } catch (err) {
    console.error(err);
    return { type: "text", message: "Error" };
  }
}

/**
 * ORDER FLOW (STATELESS SAFE)
 */
async function handleOrderFlow(userId, text) {
  let session = sessionMemory.getSession(userId) || {};
  let order = session.order || {};

  /**
   * STEP 1
   */
  if (!order.name) {
    if (text === "0") return "Enter your name:";

    sessionMemory.updateSession(userId, {
      order: { name: text },
    });

    return "Enter your address:";
  }

  /**
   * STEP 2
   */
  if (!order.address) {
    sessionMemory.updateSession(userId, {
      order: { ...order, address: text },
    });

    return "Confirm? 1 Yes / 2 No";
  }

  /**
   * STEP 3
   */
  if (text === "1") {
    const product = session.lastSelectedProduct;

    const orderRes = await shopifyClient.createOrder({
      product,
      name: order.name,
      address: order.address,
    });

    sessionMemory.updateSession(userId, {
      order: null,
      lastSelectedProduct: null,
      mode: "menu",
    });

    return `✅ Order Confirmed ${orderRes.id}`;
  }

  if (text === "2") {
    sessionMemory.updateSession(userId, {
      order: null,
      lastSelectedProduct: null,
      mode: "menu",
    });

    return "Cancelled";
  }

  return "Enter name:";
}

module.exports = messagePipeline;
