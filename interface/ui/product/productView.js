/**
 * PRODUCT VIEW UI — FINAL (CONVERSION OPTIMIZED + WHATSAPP COMPLIANT)
 */

function productView({ product = {}, source = "search" } = {}) {
  /**
   * ❌ VALIDATION
   */
  if (!product || typeof product !== "object") {
    return {
      type: "text",
      message: "Product not available. Please try again.",
      metadata: {
        screen: "product_view",
        funnel_step: "error"
      }
    };
  }

  const id = sanitizeId(product.id || product._id);
  const title = truncate(product.title || "Product", 24);
  const price = formatPrice(getPrice(product));
  const available = product.available === true;

  /**
   * 🧠 CONVERSION MESSAGE
   */
  const message =
    `${title}\n` +
    `${price}\n\n` +
    `✔ Premium Quality\n` +
    `✔ High Demand Item\n` +
    `✔ Fast Delivery Available\n\n` +
    `${available ? "⚠️ Limited stock available" : "❌ Currently out of stock"}`;

  /**
   * 🎯 BUTTONS (MAX 3 — HIGH CONVERSION)
   */
  const buttons = available
    ? [
        { id: `buy_${id}`, title: "Buy Now" },
        { id: `ask_${id}`, title: "Ask Question" },
        { id: "back_to_results", title: "Back" }
      ]
    : [
        { id: `ask_${id}`, title: "Ask Question" },
        { id: "back_to_results", title: "Back" }
      ];

  /**
   * ✅ RESPONSE
   */
  return {
    type: "interactive",
    message,
    buttons,
    metadata: {
      screen: "product_view",
      productId: id,
      price: getPrice(product),
      category: product.product_type || "",
      source,
      funnel_step: "decision",
      intent: "high"
    }
  };
}

/**
 * 🔒 SANITIZE ID
 */
function sanitizeId(id) {
  if (!id) return "unknown";

  if (typeof id === "string" && id.includes("gid://")) {
    const parts = id.split("/");
    return parts[parts.length - 1];
  }

  return String(id);
}

/**
 * 💰 GET PRICE
 */
function getPrice(product) {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return Number(product.variants[0]?.price) || 0;
  }
  return Number(product.price) || 0;
}

/**
 * 💰 FORMAT PRICE
 */
function formatPrice(price) {
  if (!price) return "PKR 0";
  return `PKR ${price}`;
}

/**
 * ✂️ TRUNCATE
 */
function truncate(text = "", limit = 24) {
  if (typeof text !== "string") text = String(text);
  if (text.length <= limit) return text;
  return text.substring(0, limit - 3) + "...";
}

module.exports = productView;
