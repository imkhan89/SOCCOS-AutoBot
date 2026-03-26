/**
 * GET PRODUCT SERVICE — FINAL (STRICT + FUNNEL READY + SAFE)
 */

const shopifyClient = require("../../integrations/shopifyClient");
const { searchBySKU } = require("../search/productSearch");
const logger = require("../../utils/logger");

/**
 * 🔍 GET PRODUCT (Flexible + Optimized)
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
        // 🚀 Fast path (cached search)
        product = await searchBySKU(cleanedSKU);

        // 🔄 Fallback to Shopify
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

    /**
     * 🧠 LIGHT NORMALIZATION (SAFE — NO UI LOGIC)
     */
    return {
      ...product,
      title: product.title || "",
      handle: product.handle || "",
      tags: product.tags || "",
      product_type: product.product_type || "",
      vendor: product.vendor || "",
      variants: Array.isArray(product.variants) ? product.variants : [],
      images: Array.isArray(product.images) ? product.images : [],
      available: getAvailability(product)
    };

  } catch (error) {
    logger.error("GetProductError", error);
    return null;
  }
}

/**
 * 🧠 AVAILABILITY CHECK
 */
function getAvailability(product) {
  if (!product || !Array.isArray(product.variants)) return false;

  return product.variants.some(v => {
    if (typeof v.available === "boolean") return v.available;
    if (typeof v.inventory_quantity === "number") return v.inventory_quantity > 0;
    return false;
  });
}

module.exports = {
  getProduct,
};
