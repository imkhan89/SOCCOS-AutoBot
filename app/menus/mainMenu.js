const sessionMemory = require("../../data/memory/sessionMemory");

module.exports = async function mainMenu(userId, text) {
  if (["hi", "hello", "start"].includes(text)) {
    sessionMemory.updateSession(userId, { currentMenu: "main" });

    return {
      type: "text",
      message:
        "1. Auto Parts\n2. Accessories\n3. Decals\n4. Support",
    };
  }

  if (text === "1") {
    sessionMemory.updateSession(userId, { currentMenu: "search" });
    return { type: "text", message: "Enter product name" };
  }

  return null;
};
