/**
 * SAE-V2 CHAT LOGGER (UPDATED — HARD CAP + MEMORY SAFE)
 */

const MAX_LOGS = 1000;
const logs = [];

/**
 * 🔒 STRICT SAFE PUSH (HARD CAP ENFORCED)
 */
function safePush(entry) {
  if (!entry) return;

  // Prevent overflow BEFORE push (more stable under load)
  if (logs.length >= MAX_LOGS) {
    logs.splice(0, logs.length - MAX_LOGS + 1);
  }

  logs.push(entry);
}

/**
 * 🧾 CHAT LOG
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
      timestamp: Date.now(), // faster + lighter than ISO string
    };

    safePush(entry);

    // Minimal logging (avoid heavy console in production)
    if (process.env.NODE_ENV !== "production") {
      console.log("CHAT:", entry);
    }
  } catch (error) {
    console.error("ChatLoggerError:", error.message);
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
      timestamp: Date.now(),
    };

    safePush(entry);

    if (process.env.NODE_ENV !== "production") {
      console.log("EVENT:", entry);
    }
  } catch (error) {
    console.error("EventLoggerError:", error.message);
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
    console.error("ClickLoggerError:", error.message);
  }
}

/**
 * 📥 GET LOGS (READ-ONLY COPY)
 */
function getLogs() {
  return [...logs]; // prevent external mutation
}

module.exports = {
  logChat,
  logEvent,
  logClick,
  getLogs,
};
