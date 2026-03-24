/**
 * SAE-V2 CHAT LOGGER (STEP 12 — TRACKING ENABLED)
 * --------------------------------
 * ✔ Chat logging
 * ✔ Product click tracking
 * ✔ Event tracking
 */

const logs = [];

/**
 * 🧾 CHAT LOG
 */
function logChat({ userId, message, response }) {
  try {
    const entry = {
      type: "CHAT",
      userId,
      message,
      response,
      timestamp: new Date().toISOString(),
    };

    logs.push(entry);

    console.log("📘 Chat Log:", entry);
  } catch (error) {
    console.error("❌ Chat Logger Error:", error.message);
  }
}

/**
 * 📊 GENERIC EVENT LOGGER
 */
function logEvent(event) {
  try {
    const entry = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    logs.push(entry);

    console.log("📊 Event:", entry);
  } catch (error) {
    console.error("❌ Event Logger Error:", error.message);
  }
}

/**
 * 🖱️ PRODUCT CLICK TRACKING (CRITICAL)
 */
function logClick(userId, product) {
  try {
    logEvent({
      type: "PRODUCT_CLICK",
      userId,
      productId: product?.id || null,
      title: product?.title || null,
      handle: product?.handle || null,
    });
  } catch (error) {
    console.error("❌ Click Logger Error:", error.message);
  }
}

/**
 * 📥 GET LOGS
 */
function getLogs() {
  return logs;
}

module.exports = {
  logChat,
  logEvent,   // ✅ NEW
  logClick,   // ✅ NEW
  getLogs,
};
