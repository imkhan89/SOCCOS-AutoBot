// interface/ui/product/productDetails.js

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
  } = product;

  const message =
`📄 *${name || "Product Details"}*

${pricingBlock({ price, originalPrice, discount })}
${stockUrgency(stock)}

📝 ${description || "High quality product with perfect fit and durability."}

${deliveryInfo()}
${deliveryETA(city)}

${trustBlock()}`;

  const buttons = buildCTAGroup([
    primaryCTA("🛒 Order Now", `order_${id}`),
    chatCTA("💬 Ask Question", `ask_${id}`)
  ]);

  return {
    type: "interactive",
    message,
    buttons,
    meta: {
      productId: id,
      screen: "product_details"
    }
  };
}

module.exports = productDetails;
