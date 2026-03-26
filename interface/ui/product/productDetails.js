const { pricingBlock } = require("../components/pricing");
const { trustBlock } = require("../components/trust");
const { stockUrgency } = require("../components/urgency");
const { deliveryInfo, deliveryETA } = require("../components/delivery");
const { buildCTAGroup, primaryCTA, chatCTA } = require("../components/cta");

function productDetails(product = {}) {
  const {
    id,
    name,
    price,
    originalPrice,
    discount,
    stock,
    description,
    city
  } = product || {};

  const safeId = id ? String(id) : "unknown";
  const safeDescription =
    description || "High quality product with perfect fit and durability.";

  const message = `📄 *${name || "Product Details"}*

${pricingBlock({ price, originalPrice, discount }) || ""}
${stockUrgency(stock) || ""}

📝 ${safeDescription}

${deliveryInfo() || ""}
${deliveryETA(city) || ""}

${trustBlock() || ""}`.trim();

  const buttons = buildCTAGroup([
    primaryCTA("🛒 Order Now", `order_${safeId}`),
    chatCTA("💬 Ask Question", `ask_${safeId}`)
  ]);

  return {
    type: "interactive",
    message: message || "Product details unavailable.",
    buttons,
    metadata: {
      productId: safeId,
      screen: "product_details"
    }
  };
}

module.exports = productDetails;
