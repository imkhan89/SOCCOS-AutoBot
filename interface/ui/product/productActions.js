const { buildCTAGroup, primaryCTA, secondaryCTA, chatCTA } = require("../components/cta");

function productActions(product = {}) {
  const { id, name } = product || {};

  const safeId = id ? String(id) : "unknown";
  const safeName = name || "this product";

  const message = `🛒 *Ready to order?*

You're selecting:
*${safeName}*

Choose an option below:`.trim();

  const buttons = buildCTAGroup([
    primaryCTA("✅ Confirm Order", `confirm_${safeId}`),
    secondaryCTA("🔙 Back to Products", "back_to_results"),
    chatCTA("💬 Talk to Support", "chat_support")
  ]);

  return {
    type: "interactive",
    message: message || "Please choose an option.",
    buttons,
    metadata: {
      productId: safeId,
      screen: "product_actions"
    }
  };
}

module.exports = productActions;
