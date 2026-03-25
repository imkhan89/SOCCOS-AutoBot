// interface/ui/components/urgency.js

function stockUrgency(stock) {
  if (!stock && stock !== 0) return "";

  if (stock === 0) {
    return "❌ Out of Stock";
  }

  if (stock <= 3) {
    return "⚠️ Only few left in stock!";
  }

  return "✅ In Stock";
}

function limitedOffer() {
  return "⏳ Limited Time Offer";
}

module.exports = {
  stockUrgency,
  limitedOffer
};
