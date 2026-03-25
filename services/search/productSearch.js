/**
 * PRODUCT SEARCH SERVICE — PRODUCTION (FIXED)
 * ------------------------------------------
 * - Supports BOTH string + object input
 * - Prevents query.toLowerCase crash
 * - Fully backward compatible
 */

const shopifyClient = require("../../integrations/shopifyClient");
const logger = require("../../utils/logger");

/**
 * 🔍 SEARCH PRODUCTS
 * @param {string|Object} input
 */
async function search(input, options = {}) {
  try {
    let query = "";
    let category = null;
    let limit = options.limit || 10;

    /**
     * ✅ SUPPORT BOTH INPUT TYPES
     */
    if (typeof input === "string") {
      query = input;
    } else if (typeof input === "object" && input !== null) {
      query = input.query || "";
      category = input.category || null;
      limit = input.limit || limit;
    }

    /**
     * ❌ INVALID INPUT
     */
    if (!query || typeof query !== "string") {
      return [];
    }

    const cleanedQuery = query.trim().toLowerCase();

    if (cleanedQuery.length < 2) {
      return [];
    }

    /**
     * 🔎 BUILD SEARCH PARAMS
     */
    const searchParams = {
      query: cleanedQuery,
      limit,
    };

    if (category) {
      searchParams.category = category;
    }

    /**
     * 📦 CALL SHOPIFY
     */
    const results = await shopifyClient.searchProducts(searchParams);

    /**
     * 🛡 SAFETY CHECK
     */
    if (!Array.isArray(results)) {
      logger.warn("Search returned non-array result");
      return [];
    }

    /**
     * ✅ CLEAN RESULTS
     */
    const safeResults = results.filter((p) => {
      return (
        p &&
        typeof p === "object" &&
        (p.id || p._id) &&
        (p.title || p.name)
      );
    });

    return safeResults.slice(0, limit);

  } catch (error) {
    logger.error("Search Error:", error.message);
    return [];
  }
}

/**
 * 🔎 SEARCH BY SKU
 */
async function searchBySKU(sku) {
  try {
    if (!sku || typeof sku !== "string") {
      return null;
    }

    const cleanedSKU = sku.trim();

    if (!cleanedSKU) {
      return null;
    }

    const product = await shopifyClient.getProductBySKU(cleanedSKU);

    if (!product || typeof product !== "object") {
      return null;
    }

    return product;

  } catch (error) {
    logger.error("SKU Search Error:", error.message);
    return null;
  }
}

module.exports = {
  search,
  searchBySKU,
};
