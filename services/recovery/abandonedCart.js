/**
 * RECOVERY SERVICE — FINAL (AUTO SEND + SILENT + CONTROLLED)
 */

const sessionMemory = require("../../data/memory/sessionMemory");
const { sendMessage } = require("../../interface/sender/whatsappSender");

// ⏱️ CONFIG
const TIME_LIMIT = 2 * 60 * 1000;   // 2 minutes (faster recovery)
const COOLDOWN = 30 * 60 * 1000;    // 30 minutes
const MAX_RECOVERY_PER_RUN = 50;    // prevent burst overload

/**
 * MAIN RECOVERY RUNNER
 */
async function runAbandonedRecovery() {
  try {
    const sessions = sessionMemory.getAllSessions();
    const now = Date.now();

    if (!sessions || typeof sessions !== "object") return;

    const userIds = Object.keys(sessions);
    let processed = 0;

    for (let i = 0; i < userIds.length; i++) {
      if (processed >= MAX_RECOVERY_PER_RUN) break;

      const userId = userIds[i];
      const session = sessions[userId];

      if (!session) continue;

      const {
        lastActivity,
        recoverySent,
        recoveryTimestamp,
        lastResults,
        lastIntent
      } = session;

      // ✅ CONDITION 1: Inactivity
      if (!lastActivity || now - lastActivity < TIME_LIMIT) continue;

      // ✅ CONDITION 2: Cooldown
      if (
        recoverySent &&
        recoveryTimestamp &&
        now - recoveryTimestamp < COOLDOWN
      ) {
        continue;
      }

      // ✅ CONDITION 3: Recoverable stage
      if (!isRecoverable(session)) continue;

      // ✅ SEND MESSAGE
      await sendRecoveryMessage(userId);

      // ✅ UPDATE SESSION
      sessionMemory.updateSession(userId, {
        recoverySent: true,
        recoveryTimestamp: now
      });

      processed++;

    }

  } catch (e) {
    // silent fail
  }
}

/**
 * RECOVERY CONDITION
 */
function isRecoverable(session) {
  return (
    session.lastIntent === "search" ||
    session.lastIntent === "browse" ||
    (Array.isArray(session.lastResults) && session.lastResults.length > 0)
  );
}

/**
 * SEND MESSAGE (HIGH CONVERSION)
 */
async function sendRecoveryMessage(userId) {
  try {
    const response = {
      type: "interactive",
      message: "Still looking for auto parts? I can help you find the right one.",
      buttons: [
        { id: "search_product", title: "Search Again" },
        { id: "browse_categories", title: "Browse Categories" },
        { id: "support", title: "Talk to Support" }
      ],
      metadata: {
        screen: "recovery",
        funnel_step: "recovery"
      }
    };

    await sendMessage(userId, response);

  } catch (e) {
    // silent
  }
}

module.exports = {
  runAbandonedRecovery
};
