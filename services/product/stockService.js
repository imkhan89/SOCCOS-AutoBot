/**
 * STOCK SERVICE — CLEAN (LOGIC ONLY)
 * ----------------------------------
 * - No UI
 * - Central stock handling
 * - Safe validation
 */

const logger = require("../../utils/logger");

/**
 * 📦 CHECK IF PRODUCT IS IN STOCK
 * @param {Object} product
 */
function isInStock(product) {
  try {
    if (!product || typeof product !== "object") {
      return false;
    }

    const stock = Number(product.stock);

    return stock > 0;

  } catch (error) {
    logger.error("Stock Check Error:", error.message);
    return false;
  }
}

/**
 * 🔢 GET AVAILABLE STOCK
 */
function getAvailableStock(product) {
  try {
    if (!product || typeof product !== "object") {
      return 0;
    }

    const stock = Number(product.stock);

    return stock > 0 ? stock : 0;

  } catch (error) {
    logger.error("Get Stock Error:", error.message);
    return 0;
  }
}

/**
 * 🛑 VALIDATE PURCHASE QUANTITY
 */
function validateQuantity(product, quantity) {
  try {
    const stock = getAvailableStock(product);

    if (!quantity || quantity <= 0) {
      return {
        valid: false,
        message: "Invalid quantity",
      };
    }

    if (quantity > stock) {
      return {
        valid: false,
        message: `Only ${stock} item(s) available`,
      };
    }

    return {
      valid: true,
    };

  } catch (error) {
    logger.error("Quantity Validation Error:", error.message);

    return {
      valid: false,
      message: "Unable to validate quantity",
    };
  }
}

module.exports = {
  isInStock,
  getAvailableStock,
  validateQuantity,
};
