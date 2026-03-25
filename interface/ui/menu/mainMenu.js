// interface/ui/menu/mainMenu.js

const { buildCTAGroup } = require("../components/cta");
const { trustBlock } = require("../components/trust");

function mainMenu() {
  const message =
`🚗 *Welcome to SOCCOS AutoParts*

Find original auto parts & accessories for your car.

What would you like to do?`;

  const buttons = buildCTAGroup([
    { id: "browse_categories", title: "🔎 Browse Categories" },
    { id: "search_product", title: "🔍 Search Product" },
    { id: "talk_support", title: "💬 Talk to Support" }
  ]);

  return {
    type: "interactive",
    message: `${message}\n\n${trustBlock()}`,
    buttons,
    meta: {
      screen: "main_menu"
    }
  };
}

module.exports = mainMenu;
