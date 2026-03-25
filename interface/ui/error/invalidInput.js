// interface/ui/error/invalidInput.js

const { buildCTAGroup, chatCTA } = require("../components/cta");

function invalidInput(input = "") {
  const message =
`❌ *Invalid Input*

We didn’t understand:
"${input}"

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
    meta: {
      screen: "invalid_input",
      input
    }
  };
}

module.exports = invalidInput;
