// interface/ui/product/productCard.js

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
  } = product;

  const message =
`🚘 *${name || "Product"}*

${pricingBlock({ price, originalPrice, discount })}
${stockUrgency(stock)}

${deliveryInfo()}

${trustBlock()}`;

  const buttons = buildCTAGroup([
    primaryCTA("🛒 Order Now", `order_${id}`),
    secondaryCTA("📄 Details", `details_${id}`)
  ]);

  return {
    type: "interactive",
    message,
    buttons,
    meta: {
      productId: id,
      screen: "product_card"
    }
  };
}

module.exports = productCard;
