/**
 * STEP 11 — WEBSITE CONVERSION PIPELINE
 * WhatsApp → Product Discovery → Website Checkout
 */

const shopifyClient = require("../../integrations/shopifyClient");
const sessionMemory = require("../../data/memory/sessionMemory");

/**
 * Build website product URL with tracking
 */
function buildProductUrl(product, userId) {
  if (!product?.handle) return "";

  return `https://ndestore.com/products/${product.handle}?utm_source=whatsapp&utm_medium=chat&utm_campaign=conversion&utm_user=${encodeURIComponent(
    userId
  )}`;
}

async function messagePipeline({ from, text }) {
  try {
    if (!from || !text) return null;

    const raw = text.trim();
    const input = raw.toLowerCase();

    const session = sessionMemory.getSession(from) || {};

    /**
     * ENTRY
     */
    if (["hi", "hello", "start", "menu"].includes(input)) {
      sessionMemory.updateSession(from, { mode: "menu" });

      return {
        type: "text",
        message:
          "👋 Welcome to Auto Parts Store\n\n" +
          "🚗 Find genuine auto parts easily\n\n" +
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
          message: "🔍 What are you looking for?",
        };
      }

      if (input === "2") {
        return {
          type: "text",
          message:
            "🛎️ Support\n\n" +
            "Please type your issue.\n" +
            "Our team will assist you shortly.",
        };
      }
    }

    /**
     * SEARCH
     */
    if (session.mode === "search" && !/^\d+$/.test(input)) {
      const results = await shopifyClient.searchProducts(raw);
      const limited = Array.isArray(results) ? results.slice(0, 5) : [];

      sessionMemory.updateSession(from, {
        lastResults: limited,
        mode: "search",
      });

      if (!limited.length) {
        return {
          type: "text",
          message:
            "❌ No products found\n\nTry another keyword (e.g. Air Filter)",
        };
      }

      const msg = limited
        .map((p, i) => {
          const price = p.variants?.[0]?.price || "";
          const url = buildProductUrl(p, from);

          return (
            `${i + 1}️⃣ ${p.title}\n` +
            `💰 Rs ${price}\n` +
            `🔗 ${url}`
          );
        })
        .join("\n\n");

      return {
        type: "text",
        message:
          "🔎 Top Results:\n\n" +
          msg +
          "\n\n👉 Tap link to order\n👉 Or reply with number for details",
      };
    }

    /**
     * PRODUCT DETAIL
     */
    if (/^\d+$/.test(input)) {
      const results = session.lastResults || [];
      const product = results[parseInt(input, 10) - 1];

      if (!product) {
        return { type: "text", message: "❌ Invalid selection" };
      }

      const price = product.variants?.[0]?.price || "";
      const url = buildProductUrl(product, from);

      sessionMemory.updateSession(from, {
        lastClickedProduct: product,
      });

      return {
        type: "text",
        message:
          `🔥 ${product.title}\n\n` +
          `💰 Rs ${price}\n\n` +
          `🚀 Order Now:\n${url}\n\n` +
          `✔ Genuine Product\n` +
          `✔ Fast Delivery\n` +
          `✔ Trusted Store\n\n` +
          `Need help? Just reply 👍`,
      };
    }

    return {
      type: "text",
      message:
        "🤖 I didn’t understand that.\n\nType *hi* to start again.",
    };
  } catch (err) {
    console.error(err);
    return { type: "text", message: "System error" };
  }
}

module.exports = messagePipeline;
