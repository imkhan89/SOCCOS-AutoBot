/**
 * CLEAN RECOVERY SERVICE — LOGIC ONLY (NO SENDING)
 * ----------------------------------------------
 * - No WhatsApp sending
 * - No UI building
 * - Only detects recovery condition
 */

const sessionMemory = require("../../data/memory/sessionMemory");

// ⏱️ CONFIG
const TIME_LIMIT = 5 * 60 * 1000; // 5 minutes inactivity
const COOLDOWN = 30 * 60 * 1000; // 30 minutes between recoveries

async function runAbandonedRecovery() {
  try {
    const sessions = sessionMemory.getAllSessions();
    const now = Date.now();

    const recoveryQueue = [];

    for (const userId in sessions) {
      const session = sessions[userId];
      if (!session) continue;

      const {
        lastClickedProduct,
        lastActivity,
        recoverySent,
        recoveryTimestamp,
      } = session;

      /**
       * ✅ CONDITION 1: Product clicked
       */
      if (!lastClickedProduct) continue;

      /**
       * ✅ CONDITION 2: Inactivity threshold
       */
      if (!lastActivity || now - lastActivity < TIME_LIMIT) continue;

      /**
       * ✅ CONDITION 3: Cooldown check
       */
      if (
        recoverySent &&
        recoveryTimestamp &&
        now - recoveryTimestamp < COOLDOWN
      ) {
        continue;
      }

      /**
       * ✅ ADD TO RECOVERY QUEUE (NO SENDING HERE)
       */
      recoveryQueue.push({
        userId,
        product: lastClickedProduct,
      });

      /**
       * ✅ UPDATE SESSION (MARK RECOVERY TRIGGERED)
       */
      sessionMemory.updateSession(userId, {
        recoverySent: true,
        recoveryTimestamp: now,
      });
    }

    return recoveryQueue;

  } catch (err) {
    console.error("❌ Recovery Error:", err.message);
    return [];
  }
}

module.exports = {
  runAbandonedRecovery,
};
