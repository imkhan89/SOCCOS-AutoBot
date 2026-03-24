/**
 * SAE-V2 AI INTEGRATION (CONTROLLED)
 * --------------------------------
 * NO autonomous decisions
 * Only fallback handler
 */

const { detectIntent } = require("./intentClassifier");

async function handleAI(userId, text) {
  try {
    const intent = detectIntent(text);

    if (intent === "greeting") {
      return {
        type: "text",
        message: "Welcome! Type a product name to search.",
      };
    }

    if (intent === "support") {
      return {
        type: "text",
        message: "Support team will contact you shortly.",
      };
    }

    if (intent === "order_status") {
      return {
        type: "text",
        message: "Enter your order ID",
      };
    }

    return null;

  } catch (error) {
    console.error("❌ AI Error:", error.message);
    return null;
  }
}

module.exports = {
  handleAI,
};
