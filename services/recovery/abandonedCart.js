/**
 * Abandoned Click Recovery Service (UPDATED — WEBSITE FLOW)
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

      // ✅ NEW LOGIC: Check if user clicked a product
      if (!session.lastClickedProduct) continue;

      // ✅ Skip if already sent recovery
      if (session.recoverySent) continue;

      const lastActivity = session.lastActivity || 0;

      // ✅ Check inactivity
      if (now - lastActivity > TIME_LIMIT) {
        const product = session.lastClickedProduct;

        const productUrl = product?.handle
          ? `https://ndestore.com/products/${product.handle}?utm_source=whatsapp&utm_medium=recovery&utm_campaign=abandoned`
          : "";

        console.log("♻️ Sending recovery message to:", userId);

        try {
          await whatsappSender.sendText(
            userId,
            "⏳ Still interested?\n\n" +
              `🔥 ${product?.title || "Your selected product"}\n\n` +
              "Complete your order here:\n" +
              `${productUrl}\n\n` +
              "⚡ Limited stock available"
          );

          // ✅ Mark as sent (avoid spam)
          sessionMemory.updateSession(userId, {
            recoverySent: true,
          });
        } catch (sendError) {
          console.error("❌ Recovery Send Error:", sendError.message);
        }
      }
    }
  } catch (err) {
    console.error("❌ Recovery Error:", err.message);
  }
}

module.exports = {
  runAbandonedRecovery,
};
