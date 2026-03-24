/**
 * Abandoned Cart Recovery Service
 * STEP 10 — Revenue Recovery Engine
 */

const sessionMemory = require("../../data/memory/sessionMemory");
const whatsappSender = require("../../interface/sender/whatsappSender");

async function runAbandonedRecovery() {
  try {
    const sessions = sessionMemory.getAllSessions();

    const now = Date.now();
    const TIME_LIMIT = 5 * 60 * 1000; // 5 minutes

    for (const userId in sessions) {
      const session = sessions[userId];

      // ✅ Skip if no active order
      if (!session.order || !session.order.step) continue;

      // ✅ Skip if already sent recovery
      if (session.recoverySent) continue;

      const lastActivity = session.lastActivity || 0;

      // ✅ Check inactivity
      if (now - lastActivity > TIME_LIMIT) {
        console.log("♻️ Sending recovery message to:", userId);

        await whatsappSender.sendText(
          userId,
          "⏳ Still interested?\n\n" +
          "Your selected item is in high demand 🔥\n\n" +
          "Reply *YES* to continue your order"
        );

        // ✅ Mark as sent (avoid spam)
        sessionMemory.updateSession(userId, {
          recoverySent: true,
        });
      }
    }
  } catch (err) {
    console.error("❌ Recovery Error:", err);
  }
}

module.exports = {
  runAbandonedRecovery,
};
