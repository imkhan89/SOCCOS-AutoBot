/**
 * FINAL PIPELINE — HARDENED + SMART FILTERED SEARCH
 */

const shopifyClient = require("../../integrations/shopifyClient");
const sessionMemory = require("../../data/memory/sessionMemory");
const { logClick } = require("../../services/logging/chatLogger");

/**
 * 🔗 BUILD PRODUCT URL
 */
function buildProductUrl(product, userId) {
  if (!product?.handle) return "";

  return `https://ndestore.com/products/${product.handle}?utm_source=whatsapp&utm_medium=chat&utm_campaign=conversion&utm_user=${encodeURIComponent(
    userId
  )}`;
}

/**
 * 🧠 SIMPLE SEARCH INTENT CHECK
 */
function isSearchQuery(input) {
  if (!input) return false;

  // ignore very short / meaningless inputs
  if (input.length < 3) return false;

  // ignore menu-like inputs
  const blocked = ["ok", "okay", "yes", "no", "hi", "hello"];
  if (blocked.includes(input)) return false;

  return true;
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
     * ✅ SMART SEARCH (CONTROLLED)
     */
    if (isSearchQuery(input) && !/^\d+$/.test(input)) {
      let results = [];

      try {
        results = await shopifyClient.searchProducts(raw);
      } catch (e) {
        console.error("❌ Shopify search error:", e.message);
      }

      const limited = Array.isArray(results) ? results.slice(0, 5) : [];

      if (limited.length) {
        sessionMemory.updateSession(from, {
          lastResults: limited,
          mode: "search",
        });

        const msg = limited
          .map((p, i) => {
            const price = p.variants?.[0]?.price || "";
            const url = buildProductUrl(p, from);

            return `${i + 1}️⃣ ${p.title}\n💰 Rs ${price}\n🔗 ${url}`;
          })
          .join("\n\n");

        return {
          type: "text",
          message:
            "🔎 Top Results:\n\n" +
            msg +
            "\n\n👉 Tap link to order\n👉 Or reply with number",
        };
      } else {
        return {
          type: "text",
          message:
            "❌ No products found\n\nTry another keyword (e.g. Air Filter)",
        };
      }
    }

    /**
     * PRODUCT SELECTION
     */
    if (/^\d+$/.test(input)) {
      const results = session.lastResults || [];

      if (!results.length) {
        return {
          type: "text",
          message:
            "⚠️ Please search for a product first\n\nType product name (e.g. Air Filter)",
        };
      }

      const index = parseInt(input, 10) - 1;
      const product = results[index];

      if (!product) {
        return {
          type: "text",
          message:
            "❌ Invalid selection\n\nPlease choose a valid number from the list",
        };
      }

      logClick(from, product);

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

    /**
     * FALLBACK
     */
    return {
      type: "text",
      message:
        "🤖 I didn’t understand that.\n\n" +
        "Try typing a product name (e.g. Air Filter)",
    };

  } catch (err) {
    console.error(err);
    return { type: "text", message: "System error" };
  }
}

module.exports = messagePipeline;
