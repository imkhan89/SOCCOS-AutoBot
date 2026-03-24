/**
 * SAE-V2 MENU MANAGER (MULTI-LAYER SYSTEM)
 * ----------------------------------------
 * Handles:
 * - Main menu
 * - Sub menus
 * - Navigation
 * - State transitions
 * NO UI formatting logic
 */

const sessionMemory = require("../../data/memory/sessionMemory");

/**
 * MENU CONFIG (CENTRALIZED)
 */
const MENUS = {
  main: {
    text: "Main Menu\n\n1. Auto Parts\n2. Accessories\n3. Decals\n4. Order Status\n5. Support\n6. Complaints",
    options: {
      "1": "autoParts",
      "2": "accessories",
      "3": "decals",
      "4": "orderStatus",
      "5": "support",
      "6": "complaints",
    },
  },

  autoParts: {
    text: "Auto Parts\n\n1. Engine Parts\n2. Filters\n3. Back",
    options: {
      "1": "engineParts",
      "2": "filters",
      "3": "main",
    },
  },

  accessories: {
    text: "Accessories\n\n1. Interior\n2. Exterior\n3. Back",
    options: {
      "1": "interior",
      "2": "exterior",
      "3": "main",
    },
  },

  decals: {
    text: "Decals\n\n1. Stickers\n2. Custom\n3. Back",
    options: {
      "1": "stickers",
      "2": "customDecals",
      "3": "main",
    },
  },

  orderStatus: {
    text: "Enter your Order ID:",
    options: {},
  },

  support: {
    text: "Support\n\nOur team will contact you shortly.",
    options: {},
  },

  complaints: {
    text: "Please describe your issue:",
    options: {},
  },
};

/**
 * GET CURRENT MENU
 */
function getCurrentMenu(userId) {
  const session = sessionMemory.getSession(userId);
  return session.currentMenu || "main";
}

/**
 * SET MENU
 */
function setMenu(userId, menuKey) {
  sessionMemory.updateSession(userId, {
    currentMenu: menuKey,
  });
}

/**
 * HANDLE MENU INPUT
 */
function handleMenu(userId, text) {
  const currentMenu = getCurrentMenu(userId);
  const menu = MENUS[currentMenu];

  // ENTRY
  if (["hi", "hello", "start"].includes(text)) {
    setMenu(userId, "main");

    return {
      type: "text",
      message: MENUS.main.text,
    };
  }

  // INVALID MENU
  if (!menu) {
    setMenu(userId, "main");

    return {
      type: "text",
      message: MENUS.main.text,
    };
  }

  // HANDLE OPTION
  const nextMenuKey = menu.options[text];

  if (nextMenuKey) {
    setMenu(userId, nextMenuKey);

    const nextMenu = MENUS[nextMenuKey];

    if (!nextMenu) {
      return {
        type: "text",
        message: "Invalid option",
      };
    }

    return {
      type: "text",
      message: nextMenu.text,
    };
  }

  // NO MATCH
  return null;
}

module.exports = {
  handleMenu,
};
