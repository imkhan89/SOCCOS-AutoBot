/**
 * SAE-V2 FORMATTER INTEGRATION
 * --------------------------------
 * Bridge between pipeline response → WhatsApp formatter
 * Decides which UI format to use
 * NO business logic
 */

const formatter = require("./whatsappFormatter");

/**
 * MAIN FORMATTER ROUTER
 */
function formatResponse(response) {
  try {
    if (!response || !response.type) return null;

    const { type, to } = response;

    if (!to) {
      console.warn("⚠️ Missing 'to' in response");
      return null;
    }

    /**
     * TEXT
     */
    if (type === "text") {
      return formatter.formatTextMessage(to, response.message);
    }

    /**
     * BUTTONS
     */
    if (type === "buttons") {
      return formatter.formatButtonMessage(
        to,
        response.message,
        response.buttons || []
      );
    }

    /**
     * LIST
     */
    if (type === "list") {
      return formatter.formatListMessage(
        to,
        response.message,
        response.sections || []
      );
    }

    /**
     * IMAGE
     */
    if (type === "image") {
      return formatter.formatImageMessage(
        to,
        response.image,
        response.caption || ""
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
