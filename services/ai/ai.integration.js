/**
 * SAE-V2 AI INTEGRATION (FINAL - CONTROLLED + SCHEMA COMPLIANT)
 * --------------------------------
 * NO autonomous decisions
 * Only fallback handler
 */

const { detectIntent } = require("./intentClassifier");

/**
 * 🧾 NORMALIZE RESPONSE
 */
function normalizeResponse(response = {}) {
  return {
    type: response.type,
    message: response.message || "",
    ...(Array.isArray(response.buttons) && response.buttons.length
      ? { buttons: response.buttons }
      : {}),
    ...(Array.isArray(response.sections) && response.sections.length
      ? { sections: response.sections }
      : {}),
    metadata: response.metadata || {}
  };
}

async function handleAI(userId, text = "") {
  try {
    if (!userId) return null;

    const intent = detectIntent(text);

    if (intent === "greeting") {
      return normalizeResponse({
        type: "text",
        message: "Welcome! Type a product name to search.",
        metadata: { screen: "ai_greeting" }
      });
    }

    if (intent === "support") {
      return normalizeResponse({
        type: "text",
        message: "Support team will contact you shortly.",
        metadata: { screen: "ai_support" }
      });
    }

    if (intent === "order_status") {
      return normalizeResponse({
        type: "text",
        message: "Enter your order ID",
        metadata: { screen: "ai_order_status" }
      });
    }

    return null;

  } catch (error) {
    return normalizeResponse({
      type: "text",
      message: "Something went wrong. Please try again.",
      metadata: { screen: "ai_error" }
    });
  }
}

module.exports = {
  handleAI
};
