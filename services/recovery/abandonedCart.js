/**
 * Abandoned Click Recovery Service (FINAL — HARDENED + SMART TIMING)
 */

const sessionMemory = require("../../data/memory/sessionMemory");
const whatsappSender = require("../../interface/sender/whatsappSender");

// ⏱️ CONFIG
const TIME_LIMIT = 5 * 60 * 1000; // 5 minutes inactivity
const COOLDOWN = 30 * 60 * 1000; // 30 minutes before next recovery allowed

/**
 * 🔗 BUILD RECOVERY URL
 */
function buildRecoveryUrl(product, userId) {
  if (!product?.handle) return "";

  return `https://ndestore.com/products/${product.handle}?utm_source=whatsapp&utm_medium=recovery&utm_campaign=abandoned&utm_user=${encodeURIComponent(
    userId
  )}`;
}

async function runAbandonedRecovery() {
  try {
    const sessions = sessionMemory.getAllSessions();
    const now = Date.now();

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
       * ✅ CONDITION 1: Must have clicked product
       */
      if (!lastClickedProduct) continue;

      /**
       * ✅ CONDITION 2: Must have inactivity
       */
      if (!lastActivity || now - lastActivity < TIME_LIMIT) continue;

      /**
       * ✅ CONDITION 3: Avoid duplicate recovery spam
       */
      if (recoverySent) {
        // optional cooldown logic
        if (recoveryTimestamp && now - recoveryTimestamp < COOLDOWN) {
          continue;
        }
      }

      const product = lastClickedProduct;
      const productUrl = buildRecoveryUrl(product, userId);

      console.log("♻️ Sending recovery message to:", userId);

      try {
        await whatsappSender.sendText(
          userId,
          "⏳ Still interested?\n\n" +
            `🔥 ${product?.title || "Your selected product"}\n\n` +
            "Complete your order here:\n" +
            `${productUrl}\n\n` +
            "⚡ Limited stock available\n\n" +
            "Reply if you need help 👍"
        );

        /**
         * ✅ UPDATE SESSION (CRITICAL)
         */
        sessionMemory.updateSession(userId, {
          recoverySent: true,
          recoveryTimestamp: Date.now(),
        });
      } catch (sendError) {
        console.error("❌ Recovery Send Error:", sendError.message);
      }
    }
  } catch (err) {
    console.error("❌ Recovery Error:", err.message);
  }
}

module.exports = {
  runAbandonedRecovery,
};
