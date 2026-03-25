// interface/ui/recovery/recoveryMessage.js

const { pricingBlock } = require("../components/pricing");
const { trustBlock } = require("../components/trust");
const { deliveryInfo } = require("../components/delivery");
const { limitedOffer } = require("../components/urgency");
const { buildCTAGroup, primaryCTA, chatCTA } = require("../components/cta");

function recoveryMessage(product = {}) {
  const {
    id,
    name,
    price,
    originalPrice,
    discount
  } = product;

  const message =
`🛒 *You left something behind...*

*${name || "Your selected product"}*

${pricingBlock({ price, originalPrice, discount })}

${limitedOffer()}

${deliveryInfo()}

${trustBlock()}

Complete your order before it’s gone!`;

  const buttons = buildCTAGroup([
    primaryCTA("✅ Complete Order", `confirm_${id}`),
    chatCTA("💬 Need Help?", `recovery_help_${id}`)
  ]);

  return {
    type: "interactive",
    message,
    buttons,
    meta: {
      productId: id,
      screen: "recovery_message"
    }
  };
}

module.exports = recoveryMessage;
