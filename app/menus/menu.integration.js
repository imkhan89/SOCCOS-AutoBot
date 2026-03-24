/**
 * SAE-V2 MENU INTEGRATION (FINAL)
 * --------------------------------
 * Connects pipeline → menu manager
 * Handles:
 * - Menu navigation
 * - Order flow routing (future-ready)
 */

const menuManager = require("./menuManager");
const sessionMemory = require("../../data/memory/sessionMemory");

/**
 * HANDLE MENU
 */
async function handleMenu(userId, text) {
  try {
    if (!userId || !text) return null;

    return menuManager.handleMenu(userId, text);

  } catch (error) {
    console.error("❌ Menu Integration Error:", error.message);
    return null;
  }
}

/**
 * HANDLE ORDER (PLACEHOLDER FOR STEP 6)
 */
async function handleOrder(userId, text) {
  try {
    const session = sessionMemory.getSession(userId);

    if (!session.order || !session.order.step) return null;

    // Step 6 will implement full order flow
    return null;

  } catch (error) {
    console.error("❌ Order Integration Error:", error.message);
    return null;
  }
}

module.exports = {
  handleMenu,
  handleOrder,
};
