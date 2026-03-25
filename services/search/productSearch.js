/**
 * CLEAN PRODUCT SEARCH SERVICE — LOGIC ONLY
 * ----------------------------------------
 * - No UI
 * - No formatting
 * - No WhatsApp
 * - Always returns safe array
 */

const shopifyClient = require("../../integrations/shopifyClient");
const logger = require("../../utils/logger");

/**
 * 🔍 SEARCH PRODUCTS
 */
async function search(query) {
  try {
    // ✅ VALIDATE INPUT
    if (!query || typeof query !== "string") {
      return [];
    }

    const cleanedQuery = query.trim();

    if (!cleanedQuery || cleanedQuery.length < 2) {
      return [];
    }

    /**
     * ✅ CALL SHOPIFY
     */
    const results = await shopifyClient.searchProducts(cleanedQuery);

    /**
     * ✅ ENSURE SAFE ARRAY
     */
    if (!Array.isArray(results)) {
      return [];
    }

    return results;

  } catch (error) {
    logger.error("Search Error:", error.message);

    return [];
  }
}

module.exports = {
  search,
};
