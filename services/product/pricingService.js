/**
 * PRICING SERVICE — CLEAN (LOGIC ONLY)
 * ------------------------------------
 * - No UI
 * - Central pricing logic
 * - Handles sale price, discounts, margins
 */

const logger = require("../../utils/logger");

/**
 * 💰 GET FINAL PRICE
 * @param {Object} product
 */
function getFinalPrice(product) {
  try {
    if (!product || typeof product !== "object") {
      return null;
    }

    const price = Number(product.price) || 0;
    const salePrice = Number(product.salePrice) || 0;

    // ✅ If sale price exists and valid
    if (salePrice > 0 && salePrice < price) {
      return salePrice;
    }

    return price;

  } catch (error) {
    logger.error("Pricing Error:", error.message);
    return null;
  }
}

/**
 * 📊 CALCULATE DISCOUNT %
 */
function getDiscountPercent(product) {
  try {
    const price = Number(product.price) || 0;
    const salePrice = Number(product.salePrice) || 0;

    if (price <= 0 || salePrice <= 0 || salePrice >= price) {
      return 0;
    }

    const discount = ((price - salePrice) / price) * 100;

    return Math.round(discount);
  } catch (error) {
    logger.error("Discount Error:", error.message);
    return 0;
  }
}

/**
 * 🏷 FORMAT PRICE (for consistency)
 */
function formatPrice(amount) {
  try {
    if (amount == null) return "Rs 0";

    const value = Number(amount) || 0;

    return `Rs ${value.toLocaleString("en-PK")}`;
  } catch (error) {
    logger.error("Format Price Error:", error.message);
    return "Rs 0";
  }
}

module.exports = {
  getFinalPrice,
  getDiscountPercent,
  formatPrice,
};
