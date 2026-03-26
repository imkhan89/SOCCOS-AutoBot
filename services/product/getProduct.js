/**
 * GET PRODUCT SERVICE — UPDATED (SAFE + RESILIENT)
 */

const shopifyClient = require("../../integrations/shopifyClient");
const { searchBySKU } = require("../search/productSearch");
const logger = require("../../utils/logger");

/**
 * 🔍 GET PRODUCT (Flexible)
 */
async function getProduct({ id, sku } = {}) {
  try {
    if (!id && !sku) return null;

    let product = null;

    /**
     * 🔎 PRIORITY 1 — ID
     */
    if (id && typeof id === "string") {
      const cleanedId = id.trim();

      if (cleanedId && typeof shopifyClient.getProductById === "function") {
        try {
          product = await shopifyClient.getProductById(cleanedId);
        } catch (e) {
          logger.error("GetProductByIdError", e);
        }
      }
    }

    /**
     * 🔎 PRIORITY 2 — SKU
     */
    if (!product && sku && typeof sku === "string") {
      const cleanedSKU = sku.trim();

      if (cleanedSKU) {
        // Prefer internal search fallback (faster + cached)
        product = await searchBySKU(cleanedSKU);

        // Optional Shopify fallback (if exists)
        if (!product && typeof shopifyClient.getProductBySKU === "function") {
          try {
            product = await shopifyClient.getProductBySKU(cleanedSKU);
          } catch (e) {
            logger.error("GetProductBySKUError", e);
          }
        }
      }
    }

    /**
     * ❌ FINAL VALIDATION
     */
    if (!product || typeof product !== "object") return null;

    if (!product.id && !product._id) return null;

    return product;

  } catch (error) {
    logger.error("GetProductError", error);
    return null;
  }
}

module.exports = {
  getProduct,
};
