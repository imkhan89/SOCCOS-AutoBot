/**
 * SAE-V2 INTENT CLASSIFIER
 * --------------------------------
 * Lightweight rule-based (safe)
 */

function detectIntent(text = "") {
  text = text.toLowerCase();

  if (["hi", "hello", "start"].includes(text)) {
    return "greeting";
  }

  if (text.includes("order")) {
    return "order_status";
  }

  if (text.includes("help") || text.includes("support")) {
    return "support";
  }

  return "search"; // default
}

module.exports = {
  detectIntent,
};
