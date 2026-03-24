const mainMenu = require("./mainMenu");
const sessionMemory = require("../../data/memory/sessionMemory");

async function handleMenu(userId, text) {
  const session = sessionMemory.getSession(userId);

  if (!session.currentMenu || session.currentMenu === "main") {
    return mainMenu(userId, text);
  }

  return null;
}

async function handleOrder(userId, text) {
  const orderMenu = require("./orderMenu");
  return orderMenu(userId, text);
}

module.exports = {
  handleMenu,
  handleOrder,
};
