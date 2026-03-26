/**
 * MAIN MENU UI — FINAL (FUNNEL OPTIMIZED + HIGH CONVERSION)
 */

function mainMenu() {
  const message = [
    "🚗 *SOCCOS AutoParts*",
    "",
    "Find the right auto part in seconds.",
    "",
    "Choose an option to continue:"
  ].join("\n");

  return {
    type: "interactive",
    message,
    buttons: [
      { id: "search_product", title: "Search Product" },
      { id: "browse_categories", title: "Browse Categories" },
      { id: "support", title: "Talk to Support" }
    ],
    metadata: {
      screen: "main_menu",
      funnel_step: "entry",
      intent: "start"
    }
  };
}

module.exports = mainMenu;
