/**
 * EVENT TRACKER — MINIMAL (PRODUCTION SAFE + SILENT)
 */

const events = [];

/**
 * TRACK EVENT
 */
function trackEvent({ user, event, screen, funnel_step }) {
  try {
    if (!user || !event) return;

    events.push({
      user,
      event,
      screen: screen || null,
      funnel_step: funnel_step || null,
      timestamp: Date.now()
    });

    // Prevent memory overflow
    if (events.length > 5000) {
      events.shift();
    }

  } catch (e) {
    // silent fail
  }
}

/**
 * GET EVENTS (for debugging later)
 */
function getEvents() {
  return events;
}

module.exports = {
  trackEvent,
  getEvents
};
