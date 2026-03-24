/**
 * SAE-V2 FORMATTER INTEGRATION (FINAL - HARDENED + UX LAYER)
 * --------------------------------
 * Bridge between pipeline → UX formatter → WhatsApp payload
 * NO business logic
 */

const formatter = require("./whatsappFormatter");

/**
 * BUILD PAYLOAD (NEW STANDARD)
 */
function buildPayload(to, response) {
  try {
    if (!response || !to) {
      console.warn("⚠️ Missing response or recipient");
      return null;
    }

    const { type } = response;

    /**
     * DEFAULT = TEXT
     */
    if (!type || type === "text") {
      const text = formatter.formatSimpleText(response.message);
      return formatter.formatTextMessage(to, text);
    }

    /**
     * MENU (UX)
     */
    if (type === "menu") {
      const text = formatter.formatMenuText(
        response.title,
        response.options
      );
      return formatter.formatTextMessage(to, text);
    }

    /**
     * PRODUCTS (UX)
     */
    if (type === "products") {
      const text = formatter.formatProductText(response.products);
      return formatter.formatTextMessage(to, text);
    }

    /**
     * ORDER (UX)
     */
    if (type === "order") {
      const text = formatter.formatOrderText(
        response.product,
        response.price
      );
      return formatter.formatTextMessage(to, text);
    }

    /**
     * BUTTONS (LOW LEVEL)
     */
    if (type === "buttons") {
      return formatter.formatButtonMessage(
        to,
        formatter.formatSimpleText(response.message),
        response.buttons || []
      );
    }

    /**
     * LIST (LOW LEVEL)
     */
    if (type === "list") {
      return formatter.formatListMessage(
        to,
        formatter.formatSimpleText(response.message),
        response.sections || []
      );
    }

    /**
     * IMAGE (LOW LEVEL)
     */
    if (type === "image") {
      return formatter.formatImageMessage(
        to,
        response.image || "",
        formatter.formatSimpleText(response.caption)
      );
    }

    /**
     * FALLBACK
     */
    const fallbackText = formatter.formatSimpleText(response.message);
    return formatter.formatTextMessage(to, fallbackText);

  } catch (error) {
    console.error("❌ Formatter Integration Error:", error.message);
    return null;
  }
}

/**
 * BACKWARD COMPATIBILITY (IMPORTANT)
 */
function formatResponse(response) {
  if (!response || !response.to) {
    console.warn("⚠️ formatResponse requires response.to");
    return null;
  }

  return buildPayload(response.to, response);
}

module.exports = {
  buildPayload,
  formatResponse,
};
