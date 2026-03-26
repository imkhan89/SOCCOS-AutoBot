/**
 * MAIN MENU UI — FINAL FIXED (STRICT SCHEMA)
 */

function mainMenu() {
  const message = [
    "🚗 *Welcome to SOCCOS AutoParts*",
    "",
    "Find original auto parts & accessories for your car.",
    "",
    "What would you like to do?"
  ].join("\n");

  return {
    type: "interactive",
    message,
    buttons: [
      { id: "browse_categories", title: "Browse Categories" },
      { id: "search_product", title: "Search Product" },
      { id: "support", title: "Talk to Support" }
    ],
    metadata: {
      screen: "main_menu"
    }
  };
}

module.exports = mainMenu;
