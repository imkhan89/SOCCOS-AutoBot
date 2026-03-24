/**
 * FINAL PIPELINE — HARDENED + SMART FILTERED SEARCH + RATE LIMITED
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
 * 🧠 SMART SEARCH INTENT CHECK (IMPROVED)
 */
function isSearchQuery(input) {
  if (!input) return false;

  // ignore very short inputs
  if (input.length < 3) return false;

  // block non-search conversational words
  const blocked = [
    "ok",
    "okay",
    "yes",
    "no",
    "hi",
    "hello",
    "thanks",
    "thank you",
  ];

  if (blocked.includes(input)) return false;

  return true;
}

async function messagePipeline({ from, text }) {
  try {
    if (!from || !text) return null;

    const raw = text.trim();
    const input = raw.toLowerCase();

    let session = sessionMemory.getSession(from) || {};

    /**
     * 🔴 STEP 1 FIX — ALWAYS UPDATE LAST ACTIVITY
     */
    sessionMemory.updateSession(from, {
      lastActivity: Date.now(),
    });

    /**
     * 🔴 STEP 3 FIX — SIMPLE RATE LIMIT (ANTI-SPAM)
     */
    if (
      session.lastMessageTime &&
      Date.now() - session.lastMessageTime < 1000
    ) {
      return null;
    }

    sessionMemory.updateSession(from, {
      lastMessageTime: Date.now(),
    });

    // refresh session after update
    session = sessionMemory.getSession(from) || {};

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
