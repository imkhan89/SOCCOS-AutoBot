/**
 * SAE-V2 FORMATTER INTEGRATION (FINAL - HARDENED)
 * --------------------------------
 * Bridge between pipeline → WhatsApp formatter
 * Central UI routing layer
 * NO business logic
 */

const formatter = require("./whatsappFormatter");

/**
 * FORMAT RESPONSE
 */
function formatResponse(response) {
  try {
    if (!response || typeof response !== "object") {
      console.warn("⚠️ Invalid response object");
      return null;
    }

    const { type, to } = response;

    if (!type) {
      console.warn("⚠️ Missing response type");
      return null;
    }

    if (!to) {
      console.warn("⚠️ Missing 'to' field");
      return null;
    }

    /**
     * TEXT
     */
    if (type === "text") {
      return formatter.formatTextMessage(
        to,
        (response.message || "").toString()
      );
    }

    /**
     * BUTTONS
     */
    if (type === "buttons") {
      return formatter.formatButtonMessage(
        to,
        (response.message || "").toString(),
        response.buttons || []
      );
    }

    /**
     * LIST
     */
    if (type === "list") {
      return formatter.formatListMessage(
        to,
        (response.message || "").toString(),
        response.sections || []
      );
    }

    /**
     * IMAGE
     */
    if (type === "image") {
      return formatter.formatImageMessage(
        to,
        response.image || "",
        (response.caption || "").toString()
      );
    }

    console.warn("⚠️ Unknown response type:", type);
    return null;

  } catch (error) {
    console.error("❌ Formatter Integration Error:", error.message);
    return null;
  }
}

module.exports = {
  formatResponse,
};
