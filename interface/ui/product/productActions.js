// interface/ui/product/productActions.js

const { buildCTAGroup, primaryCTA, secondaryCTA, chatCTA } = require("../components/cta");

function productActions(product = {}) {
  const { id, name } = product;

  const message =
`🛒 *Ready to order?*

You're selecting:
*${name || "this product"}*

Choose an option below:`;

  const buttons = buildCTAGroup([
    primaryCTA("✅ Confirm Order", `confirm_${id}`),
    secondaryCTA("🔙 Back to Products", "back_to_results"),
    chatCTA("💬 Talk to Support", "chat_support")
  ]);

  return {
    type: "interactive",
    message,
    buttons,
    meta: {
      productId: id,
      screen: "product_actions"
    }
  };
}

module.exports = productActions;
