const { buildCTAGroup, chatCTA } = require("../components/cta");

function invalidInput(input = "") {
  const safeInput = input || "your request";

  const message = `❌ *Invalid Input*

We didn’t understand:
"${safeInput}"

Please choose a valid option below or try again.`;

  const buttons = buildCTAGroup([
    { id: "main_menu", title: "🏠 Main Menu" },
    { id: "search_product", title: "🔍 Search Product" },
    chatCTA("💬 Get Help", "chat_support")
  ]);

  return {
    type: "interactive",
    message,
    buttons,
    metadata: {
      screen: "invalid_input",
      input: safeInput
    }
  };
}

module.exports = invalidInput;
