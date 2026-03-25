/**
 * GET PRODUCT SERVICE — CLEAN (LOGIC ONLY)
 * ----------------------------------------
 * - No UI
 * - No formatting
 * - Supports ID + SKU
 * - Safe outputs
 */

const shopifyClient = require("../../integrations/shopifyClient");
const logger = require("../../utils/logger");

/**
 * 🔍 GET PRODUCT (Flexible)
 * @param {Object} params
 * @param {string} [params.id]
 * @param {string} [params.sku]
 */
async function getProduct({ id, sku } = {}) {
  try {
    // ❌ No input
    if (!id && !sku) {
      return null;
    }

    let product = null;

    // 🔎 Priority 1: ID
    if (id && typeof id === "string") {
      const cleanedId = id.trim();

      if (cleanedId) {
        product = await shopifyClient.getProductById(cleanedId);
      }
    }

    // 🔎 Priority 2: SKU (fallback)
    if (!product && sku && typeof sku === "string") {
      const cleanedSKU = sku.trim();

      if (cleanedSKU) {
        product = await shopifyClient.getProductBySKU(cleanedSKU);
      }
    }

    // ❌ Invalid response
    if (!product || typeof product !== "object") {
      return null;
    }

    // ✅ Basic validation
    if (!product.id && !product._id) {
      return null;
    }

    return product;

  } catch (error) {
    logger.error("Get Product Error:", error.message);
    return null;
  }
}

module.exports = {
  getProduct,
};
