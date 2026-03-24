/**
 * SAE-V2 WHATSAPP SERVICE (FINAL - REFACTORED)
 * --------------------------------
 * Single entry point for sending messages
 * Uses formatter.integration layer
 * NO direct formatter usage
 */

const formatterIntegration = require("../interface/formatters/formatter.integration");
const sender = require("../interface/sender/whatsappSender");

/**
 * SEND RESPONSE (MAIN FUNCTION)
 */
async function sendResponse(response) {
  try {
    if (!response || typeof response !== "object") {
      console.warn("⚠️ Invalid response object");
      return null;
    }

    /**
     * FORMAT RESPONSE → WhatsApp payload
     */
    const payload = formatterIntegration.formatResponse(response);

    if (!payload) {
      console.warn("⚠️ Failed to format response");
      return null;
    }

    /**
     * SEND MESSAGE
     */
    return await sender.send(payload);

  } catch (error) {
    console.error("❌ WhatsApp sendResponse error:", error.message);
    return null;
  }
}

module.exports = {
  sendResponse,
};
