// interface/ui/components/cta.js

function primaryCTA(label = "Order Now", action = "order_now") {
  return {
    id: action,
    title: label
  };
}

function secondaryCTA(label = "View Details", action = "view_details") {
  return {
    id: action,
    title: label
  };
}

function chatCTA(label = "Talk to Support", action = "chat_support") {
  return {
    id: action,
    title: label
  };
}

function buildCTAGroup(ctas = []) {
  return ctas.slice(0, 3); // WhatsApp max 3 buttons
}

module.exports = {
  primaryCTA,
  secondaryCTA,
  chatCTA,
  buildCTAGroup
};
