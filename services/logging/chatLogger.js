/**
 * SAE-V2 CHAT LOGGER (FINAL — CLEAN + SAFE)
 */

const logs = [];

/**
 * 🧾 CHAT LOG (CLEAN)
 */
function logChat({ userId, message, response }) {
  try {
    if (!userId || !message) return;

    const entry = {
      type: "CHAT",
      userId: String(userId).trim(),
      message: String(message).trim(),
      response:
        typeof response === "string"
          ? response.trim()
          : response?.message || null,
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
    if (!event || typeof event !== "object") return;

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
 * 🖱️ PRODUCT CLICK TRACKING
 */
function logClick(userId, product) {
  try {
    if (!userId || !product) return;

    logEvent({
      type: "PRODUCT_CLICK",
      userId: String(userId).trim(),
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
  logEvent,
  logClick,
  getLogs,
};
