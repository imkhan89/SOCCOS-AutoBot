const { buildCTAGroup, chatCTA } = require("../components/cta");

function fallbackMessage() {
  const message = `⚠️ *Something went wrong*

We couldn’t process your request.

Please try again or choose an option below:`;

  const buttons = buildCTAGroup([
    { id: "main_menu", title: "🏠 Main Menu" },
    { id: "browse_categories", title: "📦 Browse Categories" },
    chatCTA("💬 Talk to Support", "chat_support")
  ]);

  return {
    type: "interactive",
    message,
    buttons,
    metadata: {
      screen: "fallback_error"
    }
  };
}

module.exports = fallbackMessage;
