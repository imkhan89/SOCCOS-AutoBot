/**
 * CLEAN RECOVERY SERVICE — UPDATED (SAFE + CONTROLLED)
 */

const sessionMemory = require("../../data/memory/sessionMemory");

// ⏱️ CONFIG
const TIME_LIMIT = 5 * 60 * 1000;   // 5 minutes
const COOLDOWN = 30 * 60 * 1000;    // 30 minutes
const MAX_RECOVERY_PER_RUN = 100;   // prevent burst overload

async function runAbandonedRecovery() {
  try {
    const sessions = sessionMemory.getAllSessions();
    const now = Date.now();

    const recoveryQueue = [];

    if (!sessions || typeof sessions !== "object") {
      return [];
    }

    const userIds = Object.keys(sessions);

    for (let i = 0; i < userIds.length; i++) {
      if (recoveryQueue.length >= MAX_RECOVERY_PER_RUN) break;

      const userId = userIds[i];
      const session = sessions[userId];

      if (!session) continue;

      const {
        lastClickedProduct,
        lastActivity,
        recoverySent,
        recoveryTimestamp,
      } = session;

      // ✅ CONDITION 1: Product clicked
      if (!lastClickedProduct) continue;

      // ✅ CONDITION 2: Inactivity threshold
      if (!lastActivity || now - lastActivity < TIME_LIMIT) continue;

      // ✅ CONDITION 3: Cooldown check
      if (
        recoverySent &&
        recoveryTimestamp &&
        now - recoveryTimestamp < COOLDOWN
      ) {
        continue;
      }

      // ✅ ADD TO RECOVERY QUEUE
      recoveryQueue.push({
        userId,
        product: lastClickedProduct,
      });

      // ✅ UPDATE SESSION
      sessionMemory.updateSession(userId, {
        recoverySent: true,
        recoveryTimestamp: now,
      });
    }

    return recoveryQueue;

  } catch (err) {
    console.error("RecoveryError:", err.message);
    return [];
  }
}

module.exports = {
  runAbandonedRecovery,
};
