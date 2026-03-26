const { pricingBlock } = require("../components/pricing");
const { trustBlock } = require("../components/trust");
const { stockUrgency } = require("../components/urgency");
const { deliveryInfo } = require("../components/delivery");
const { buildCTAGroup, primaryCTA, secondaryCTA } = require("../components/cta");

function productCard(product = {}) {
  const {
    id,
    name,
    price,
    originalPrice,
    discount,
    stock
  } = product || {};

  const safeId = id ? String(id) : "unknown";

  const message = `🚘 *${name || "Product"}*

${pricingBlock({ price, originalPrice, discount }) || ""}
${stockUrgency(stock) || ""}

${deliveryInfo() || ""}

${trustBlock() || ""}`.trim();

  const buttons = buildCTAGroup([
    primaryCTA("🛒 Order Now", `order_${safeId}`),
    secondaryCTA("📄 Details", `details_${safeId}`)
  ]);

  return {
    type: "interactive",
    message: message || "Product details unavailable.",
    buttons,
    metadata: {
      productId: safeId,
      screen: "product_card"
    }
  };
}

module.exports = productCard;
