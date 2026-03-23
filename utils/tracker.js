/**
 * SOCCOS-AutoBot
 * Tracking Utility (Phase 1 — Console आधारित)
 */

function trackEvent(event, data = {}) {
  try {
    console.log("📊 TRACK:", {
      event,
      ...data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Tracking error:", error.message);
  }
}

module.exports = { trackEvent };
