// interface/ui/components/trust.js

function trustBadges() {
  return [
    "✔ Original Quality",
    "✔ Verified Fit",
    "✔ Trusted by Car Owners",
    "✔ Easy Returns"
  ];
}

function trustBlock() {
  return trustBadges().join("\n");
}

module.exports = {
  trustBlock,
  trustBadges
};
