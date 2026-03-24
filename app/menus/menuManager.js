const sessionMemory = require("../../data/memory/sessionMemory");

function setMenu(userId, menu) {
  sessionMemory.updateSession(userId, { currentMenu: menu });
}

function getMenu(userId) {
  return sessionMemory.getSession(userId).currentMenu || "main";
}

module.exports = {
  setMenu,
  getMenu,
};
