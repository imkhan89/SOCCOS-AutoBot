/**
 * SAE-V2 MENU INTEGRATION (STEP 6 FINAL)
 * --------------------------------
 * Connects:
 * - Pipeline → Menu Manager
 * - Pipeline → Order Flow
 * Clean routing layer
 */

const menuManager = require("./menuManager");
const orderFlow = require("./orderFlow");

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
 * HANDLE ORDER FLOW
 */
async function handleOrder(userId, text) {
  try {
    return await orderFlow.handleOrder(userId, text);

  } catch (error) {
    console.error("❌ Order Integration Error:", error.message);
    return null;
  }
}

module.exports = {
  handleMenu,
  handleOrder,
};
