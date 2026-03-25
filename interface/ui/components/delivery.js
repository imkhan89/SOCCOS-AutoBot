// interface/ui/components/delivery.js

function deliveryInfo() {
  return "🚚 Delivery All Over Pakistan\n💵 Cash on Delivery Available";
}

function deliveryETA(city = "") {
  if (!city) {
    return "📦 Delivery in 2-4 working days";
  }

  return `📦 Delivery to ${city}: 2-4 working days`;
}

module.exports = {
  deliveryInfo,
  deliveryETA
};
