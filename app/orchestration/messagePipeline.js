/**
 * FINAL STABLE PIPELINE — TEXT ONLY
 * Revenue-optimized, with safe upsell flow
 */

const shopifyClient = require("../../integrations/shopifyClient");
const sessionMemory = require("../../data/memory/sessionMemory");

function isMenuTrigger(text) {
  return ["hi", "hello", "start", "menu"].includes(text);
}

function formatPrice(product) {
  return product?.variants?.[0]?.price || "";
}

function getUpsellOffer(product) {
  const title = (product?.title || "").toLowerCase();

  if (title.includes("air filter")) {
    return {
      title: "Oil Filter",
      price: "850",
      message: "Best paired with this product for better engine protection.",
    };
  }

  if (title.includes("oil filter")) {
    return {
      title: "Air Filter",
      price: "850",
      message: "A useful add-on for better engine performance.",
    };
  }

  if (title.includes("cabin filter")) {
    return {
      title: "Air Filter",
      price: "850",
      message: "A useful add-on for complete filtration support.",
    };
  }

  return {
    title: "Recommended Add-on",
    price: "850",
    message: "Popular with this product.",
  };
}

async function messagePipeline({ from, text }) {
  try {
    console.log("🔥 Pipeline triggered", { from, text });

    if (!from || typeof text !== "string") return null;

    const rawText = text.trim();
    const normalized = rawText.toLowerCase();
    const session = sessionMemory.getSession(from) || {};

    /**
     * ORDER FLOW ALWAYS HAS PRIORITY
     */
    if (session.order && session.order.step) {
      return {
        type: "text",
        message: await handleOrderFlow(from, rawText, normalized),
      };
    }

    /**
     * ENTRY
     */
    if (isMenuTrigger(normalized)) {
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
      if (normalized === "1") {
        sessionMemory.updateSession(from, { mode: "search" });

        return {
          type: "text",
          message: "🔍 Enter product name",
        };
      }

      if (normalized === "2") {
        return {
          type: "text",
          message:
            "🛎️ Support\n\n" +
            "Please reply with your issue or question.\n" +
            "Our team will assist you shortly.",
        };
      }
    }

    /**
     * SEARCH
     */
    if (session.mode === "search" && !/^\d+$/.test(normalized)) {
      const results = await shopifyClient.searchProducts(rawText);
      const limited = Array.isArray(results) ? results.slice(0, 5) : [];

      sessionMemory.updateSession(from, {
        lastResults: limited,
        mode: "search",
      });

      if (limited.length === 0) {
        return {
          type: "text",
          message: "❌ No products found. Try another keyword.",
        };
      }

      const msg = limited
        .map((p, i) => {
          const price = formatPrice(p);
          return `${i + 1}️⃣ ${p.title} - Rs ${price}`;
        })
        .join("\n");

      return {
        type: "text",
        message: `🔎 Top Results:\n\n${msg}\n\nReply with number`,
      };
    }

    /**
     * PRODUCT SELECTION
     */
    if (/^\d+$/.test(normalized)) {
      const results = session.lastResults || [];
      const product = results[parseInt(normalized, 10) - 1];

      if (!product) {
        return { type: "text", message: "❌ Invalid selection" };
      }

      const price = formatPrice(product);
      const upsell = getUpsellOffer(product);

      sessionMemory.updateSession(from, {
        order: {
          step: "upsell_offer",
          product,
          upsell,
          upsellSelected: false,
        },
      });

      return {
        type: "text",
        message:
          `🔥 Top Choice\n\n` +
          `🛒 ${product.title}\n` +
          `💰 Rs ${price}\n\n` +
          `✔ Original Product\n` +
          `✔ Fast Delivery\n` +
          `✔ Cash on Delivery\n\n` +
          `───────────────\n` +
          `🔥 Recommended Add-on:\n` +
          `${upsell.title} - Rs ${upsell.price}\n` +
          `${upsell.message}\n\n` +
          `1️⃣ Add to order\n` +
          `2️⃣ Skip`,
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
async function handleOrderFlow(userId, rawText, normalizedText) {
  const session = sessionMemory.getSession(userId) || {};
  const order = session.order;

  if (!order) return null;

  /**
   * STEP 0 — UPSELL
   */
  if (order.step === "upsell_offer") {
    if (normalizedText === "1") {
      sessionMemory.updateSession(userId, {
        order: {
          ...order,
          upsellSelected: true,
          step: "awaiting_name",
        },
      });

      return "✅ Add-on added!\n\nEnter your name:";
    }

    if (normalizedText === "2") {
      sessionMemory.updateSession(userId, {
        order: {
          ...order,
          upsellSelected: false,
          step: "awaiting_name",
        },
      });

      return "👍 No problem\n\nEnter your name:";
    }

    return "Reply 1 to add or 2 to skip";
  }

  /**
   * STEP 1 — NAME
   */
  if (order.step === "awaiting_name") {
    sessionMemory.updateSession(userId, {
      order: {
        ...order,
        step: "awaiting_address",
        name: rawText.trim(),
      },
    });

    return (
      "📍 Enter your address (City + Area)\n\n" +
      "We deliver all over Pakistan 🇵🇰\n" +
      "Cash on Delivery available"
    );
  }

  /**
   * STEP 2 — ADDRESS
   */
  if (order.step === "awaiting_address") {
    sessionMemory.updateSession(userId, {
      order: {
        ...order,
        step: "confirm_order",
        address: rawText.trim(),
      },
    });

    return (
      "🧾 Order Summary:\n\n" +
      `Product: ${order.product?.title || "-" }\n` +
      `${order.upsellSelected ? `Add-on: ${order.upsell?.title || "Included"}\n` : ""}` +
      "\n───────────────\n" +
      "✔ Original Product\n" +
      "✔ Quality Checked\n" +
      "✔ Cash on Delivery\n" +
      "✔ 2–4 Days Delivery\n\n" +
      "Confirm your order:\n\n" +
      "1️⃣ Yes\n2️⃣ No"
    );
  }

  /**
   * STEP 3 — CONFIRM
   */
  if (order.step === "confirm_order") {
    if (normalizedText === "1") {
      const res = await shopifyClient.createOrder({
        product: order.product,
        name: order.name,
        address: order.address,
      });

      sessionMemory.updateSession(userId, {
        order: null,
        mode: "menu",
        lastResults: session.lastResults || [],
      });

      return (
        "✅ Order Confirmed\n\n" +
        `🆔 ID: ${res?.id || "N/A"}\n\n` +
        "Our team may contact you.\n" +
        "Delivery: 2–4 days 🚚"
      );
    }

    if (normalizedText === "2") {
      sessionMemory.updateSession(userId, {
        order: null,
        mode: "menu",
        lastResults: session.lastResults || [],
      });

      return "❌ Order cancelled";
    }

    return "Reply 1 to confirm or 2 to cancel";
  }

  return null;
}

module.exports = messagePipeline;
