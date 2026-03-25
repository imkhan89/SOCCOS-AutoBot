/**
 * PRODUCT SEARCH SERVICE — PRODUCTION (CLEAN + SCALABLE)
 * -----------------------------------------------------
 * - Logic only (NO UI / NO WhatsApp formatting)
 * - Shopify-based search
 * - Input sanitization
 * - Consistent safe output (always array)
 * - Ready for future filters (category, SKU, etc.)
 */

const shopifyClient = require("../../integrations/shopifyClient");
const logger = require("../../utils/logger");

/**
 * 🔍 SEARCH PRODUCTS
 * @param {Object} params
 * @param {string} params.query
 * @param {string} [params.category]
 * @param {number} [params.limit]
 */
async function search({ query, category = null, limit = 10 } = {}) {
  try {
    // ✅ INPUT VALIDATION
    if (!query || typeof query !== "string") {
      return [];
    }

    const cleanedQuery = query.trim();

    if (cleanedQuery.length < 2) {
      return [];
    }

    // ✅ BUILD SEARCH PAYLOAD
    const searchParams = {
      query: cleanedQuery,
      limit,
    };

    if (category) {
      searchParams.category = category;
    }

    // ✅ CALL SHOPIFY CLIENT
    const results = await shopifyClient.searchProducts(searchParams);

    // ✅ ENSURE ARRAY SAFETY
    if (!Array.isArray(results)) {
      logger.warn("Search returned non-array result");
      return [];
    }

    // ✅ OPTIONAL: FILTER OUT INVALID PRODUCTS
    const safeResults = results.filter((p) => {
      return (
        p &&
        typeof p === "object" &&
        (p.id || p._id) &&
        p.title
      );
    });

    return safeResults.slice(0, limit);

  } catch (error) {
    logger.error("Search Error:", error.message);

    return [];
  }
}

/**
 * 🔎 SEARCH BY SKU (for direct product intent)
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
