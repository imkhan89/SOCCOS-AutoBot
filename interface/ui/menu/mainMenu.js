/**
 * MAIN MENU UI — UPDATED (PURE + STANDARDIZED)
 */

const { buildCTAGroup } = require("../components/cta");
const { trustBlock } = require("../components/trust");

function mainMenu() {
  const message = [
    "🚗 *Welcome to SOCCOS AutoParts*",
    "",
    "Find original auto parts & accessories for your car.",
    "",
    "What would you like to do?",
    "",
    trustBlock()
  ].join("\n");

  const buttons = buildCTAGroup([
    { id: "browse_categories", title: "Browse Categories" },
    { id: "search_product", title: "Search Product" },
    { id: "support", title: "Talk to Support" }
  ]);

  return {
    type: "interactive",
    message,
    buttons,
    metadata: {
      screen: "main_menu"
    }
  };
}

module.exports = mainMenu;
