// interface/ui/recovery/recoveryReminder.js

const { buildCTAGroup, primaryCTA, chatCTA } = require("../components/cta");

function recoveryReminder(product = {}) {
  const { id, name } = product;

  const message =
`⏳ *Still thinking?*

Your selected item is waiting:

*${name || "Product"}*

Let us know if you’d like to proceed or need help.`;

  const buttons = buildCTAGroup([
    primaryCTA("🛒 Order Now", `confirm_${id}`),
    chatCTA("💬 Ask Question", `recovery_question_${id}`)
  ]);

  return {
    type: "interactive",
    message,
    buttons,
    meta: {
      productId: id,
      screen: "recovery_reminder"
    }
  };
}

module.exports = recoveryReminder;
