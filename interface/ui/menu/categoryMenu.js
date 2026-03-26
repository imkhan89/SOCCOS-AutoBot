const { buildCTAGroup } = require("../components/cta");

function categoryMenu() {
  const message = `📦 *Browse Categories*

Select a category to explore products:`;

  const buttons = buildCTAGroup([
    { id: "category_service_parts", title: "🔧 Service Parts" },
    { id: "category_accessories", title: "🚘 Accessories" },
    { id: "category_car_care", title: "🧼 Car Care" }
  ]);

  return {
    type: "interactive",
    message,
    buttons,
    metadata: {
      screen: "category_menu"
    }
  };
}

module.exports = categoryMenu;
