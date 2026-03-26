const { buildCTAGroup, primaryCTA, chatCTA } = require("../components/cta");

function recoveryReminder(product = {}) {
  const { id, name } = product || {};

  const safeId = id ? String(id) : "unknown";
  const safeName = name || "Product";

  const message = `⏳ *Still thinking?*

Your selected item is waiting:

*${safeName}*

Let us know if you’d like to proceed or need help.`.trim();

  const buttons = buildCTAGroup([
    primaryCTA("🛒 Order Now", `confirm_${safeId}`),
    chatCTA("💬 Ask Question", `recovery_question_${safeId}`)
  ]);

  return {
    type: "interactive",
    message: message || "Your product is waiting.",
    buttons,
    metadata: {
      productId: safeId,
      screen: "recovery_reminder"
    }
  };
}

module.exports = recoveryReminder;
