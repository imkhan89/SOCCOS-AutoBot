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
  } = product || {};

  const safeId = id ? String(id) : "unknown";
  const safeName = name || "Your selected product";

  const message = `🛒 *You left something behind...*

*${safeName}*

${pricingBlock({ price, originalPrice, discount }) || ""}

${limitedOffer() || ""}

${deliveryInfo() || ""}

${trustBlock() || ""}

Complete your order before it’s gone!`.trim();

  const buttons = buildCTAGroup([
    primaryCTA("✅ Complete Order", `confirm_${safeId}`),
    chatCTA("💬 Need Help?", `recovery_help_${safeId}`)
  ]);

  return {
    type: "interactive",
    message: message || "Complete your order before it’s gone!",
    buttons,
    metadata: {
      productId: safeId,
      screen: "recovery_message"
    }
  };
}

module.exports = recoveryMessage;
