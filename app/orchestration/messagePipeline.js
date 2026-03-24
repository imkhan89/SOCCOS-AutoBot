/**
 * FINAL PIPELINE — STEP 10 (RECOVERY ENABLED)
 */

const shopifyClient = require("../../integrations/shopifyClient");
const sessionMemory = require("../../data/memory/sessionMemory");

/**
 * 🧠 SMART UPSELL
 */
function getUpsell(product) {
  const title = (product?.title || "").toLowerCase();

  if (title.includes("air filter")) {
    return { title: "Oil Filter", price: 850 };
  }

  if (title.includes("oil filter")) {
    return { title: "Air Filter", price: 1200 };
  }

  return { title: "Maintenance Kit", price: 1500 };
}

async function messagePipeline({ from, text }) {
  try {
    if (!from || !text) return null;

    const raw = text.trim();
    const input = raw.toLowerCase();

    const session = sessionMemory.getSession(from) || {};

    /**
     * ✅ STEP 10 — RESUME FLOW (CRITICAL)
     */
    if (input === "yes") {
      if (session?.order && session.order.step) {
        sessionMemory.updateSession(from, {
          recoverySent: false,
        });

        return {
          type: "text",
          message:
            "✅ Resuming your order...\n\n" +
            "Please continue below 👇",
        };
      }
    }

    /**
     * ✅ ORDER FLOW PRIORITY
     */
    if (session.order && session.order.step) {
      return {
        type: "text",
        message: await handleOrderFlow(from, raw, input),
      };
    }

    /**
     * ENTRY
     */
    if (["hi", "hello", "start"].includes(input)) {
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
      if (input === "1") {
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
    if (session.mode === "search" && !/^\d+$/.test(input)) {
      const results = await shopifyClient.searchProducts(raw);
      const limited = results.slice(0, 5);

      sessionMemory.updateSession(from, {
        lastResults: limited,
        mode: "search",
      });

      if (!limited.length) {
        return {
          type: "text",
          message: "❌ No products found",
        };
      }

      const msg = limited
        .map((p, i) => {
          const price = p.variants?.[0]?.price || "";
          return `${i + 1}️⃣ ${p.title} - Rs ${price}`;
        })
        .join("\n");

      return {
        type: "text",
        message: `🔎 Top Results:\n\n${msg}\n\nReply with number`,
      };
    }

    /**
     * PRODUCT SELECTION → UPSSELL
     */
    if (/^\d+$/.test(input)) {
      const results = session.lastResults || [];
      const product = results[parseInt(input) - 1];

      if (!product) {
        return { type: "text", message: "❌ Invalid selection" };
      }

      const price = product.variants?.[0]?.price || "";
      const upsell = getUpsell(product);

      sessionMemory.updateSession(from, {
        order: {
          step: "upsell_offer",
          product,
          upsell,
        },
        recoverySent: false, // reset recovery
      });

      return {
        type: "text",
        message:
          `🔥 Great Choice\n\n` +
          `🛒 ${product.title}\n` +
          `💰 Rs ${price}\n\n` +
          `───────────────\n` +
          `🔥 Add-on:\n` +
          `${upsell.title} - Rs ${upsell.price}\n\n` +
          `1️⃣ Add\n2️⃣ Skip`,
      };
    }

    return { type: "text", message: "Try again" };

  } catch (err) {
    console.error(err);
    return { type: "text", message: "System error" };
  }
}

/**
 * 🧾 ORDER FLOW
 */
async function handleOrderFlow(userId, raw, input) {
  const session = sessionMemory.getSession(userId) || {};
  const order = session.order;

  if (!order) return null;

  /**
   * STEP 0 — UPSELL
   */
  if (order.step === "upsell_offer") {
    if (input === "1") {
      sessionMemory.updateSession(userId, {
        order: {
          ...order,
          upsellSelected: true,
          step: "quantity_offer",
        },
      });

      return (
        `✅ ${order.upsell.title} added\n\n` +
        `🔥 Offer: Buy 2 & save Rs 200\n\n` +
        `1️⃣ Yes\n2️⃣ No`
      );
    }

    if (input === "2") {
      sessionMemory.updateSession(userId, {
        order: {
          ...order,
          upsellSelected: false,
          step: "awaiting_name",
        },
      });

      return "👍 Proceeding\n\nEnter your name:";
    }

    return "Reply 1 or 2";
  }

  /**
   * STEP 1 — QUANTITY
   */
  if (order.step === "quantity_offer") {
    if (input === "1") {
      sessionMemory.updateSession(userId, {
        order: {
          ...order,
          quantity: 2,
          step: "awaiting_name",
        },
      });

      return "🔥 Discount applied\n\nEnter your name:";
    }

    if (input === "2") {
      sessionMemory.updateSession(userId, {
        order: {
          ...order,
          quantity: 1,
          step: "awaiting_name",
        },
      });

      return "👍 Done\n\nEnter your name:";
    }

    return "Reply 1 or 2";
  }

  /**
   * STEP 2 — NAME
   */
  if (order.step === "awaiting_name") {
    sessionMemory.updateSession(userId, {
      order: { ...order, name: raw, step: "awaiting_address" },
    });

    return "📍 Enter your address:";
  }

  /**
   * STEP 3 — ADDRESS
   */
  if (order.step === "awaiting_address") {
    sessionMemory.updateSession(userId, {
      order: { ...order, address: raw, step: "confirm_order" },
    });

    return (
      "🧾 Order Summary:\n\n" +
      `Product: ${order.product.title}\n` +
      (order.upsellSelected
        ? `Add-on: ${order.upsell.title}\n`
        : "") +
      (order.quantity ? `Qty: ${order.quantity}\n` : "") +
      "\nConfirm:\n\n1️⃣ Yes\n2️⃣ No"
    );
  }

  /**
   * STEP 4 — CONFIRM
   */
  if (order.step === "confirm_order") {
    if (input === "1") {
      const res = await shopifyClient.createOrder({
        product: order.product,
        name: order.name,
        address: order.address,
      });

      sessionMemory.updateSession(userId, {
        order: null,
        mode: "menu",
        recoverySent: false,
      });

      return `✅ Order Confirmed\nID: ${res.id}`;
    }

    if (input === "2") {
      sessionMemory.updateSession(userId, {
        order: null,
        mode: "menu",
        recoverySent: false,
      });

      return "❌ Cancelled";
    }

    return "Reply 1 or 2";
  }

  return null;
}

module.exports = messagePipeline;
