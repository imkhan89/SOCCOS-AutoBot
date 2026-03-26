/**
 * ADD TO CART UI — FINAL (CONVERSION PUSH + WHATSAPP COMPLIANT)
 */

function addToCart({ product = {} } = {}) {
  /**
   * ❌ VALIDATION
   */
  if (!product || typeof product !== "object") {
    return {
      type: "text",
      message: "Unable to process request. Please try again.",
      metadata: {
        screen: "add_to_cart",
        funnel_step: "error"
      }
    };
  }

  const id = sanitizeId(product.id || product._id);
  const title = truncate(product.title || "Product", 24);
  const price = formatPrice(getPrice(product));

  /**
   * 🧠 CONVERSION MESSAGE
   */
  const message =
    `🛒 ${title}\n` +
    `${price}\n\n` +
    `✅ Added to your order\n` +
    `🚀 Ready to checkout now`;

  /**
   * 🎯 BUTTONS (MAX 3)
   */
  const buttons = [
    { id: `checkout_${id}`, title: "Checkout Now" },
    { id: "continue_shopping", title: "More Products" },
    { id: "support", title: "Need Help?" }
  ];

  /**
   * ✅ RESPONSE
   */
  return {
    type: "interactive",
    message,
    buttons,
    metadata: {
      screen: "add_to_cart",
      productId: id,
      price: getPrice(product),
      funnel_step: "intent",
      intent: "purchase"
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

module.exports = addToCart;
