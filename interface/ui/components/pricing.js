// interface/ui/components/pricing.js

function formatPrice(price) {
  if (!price) return "";
  return `Rs. ${Number(price).toLocaleString("en-PK")}`;
}

function pricingBlock({ price, originalPrice, discount }) {
  let message = `💰 *${formatPrice(price)}*`;

  if (originalPrice && originalPrice > price) {
    message += `\n~~${formatPrice(originalPrice)}~~`;
  }

  if (discount) {
    message += `\n🔥 Save ${discount}%`;
  }

  return message;
}

module.exports = {
  pricingBlock,
  formatPrice
};
