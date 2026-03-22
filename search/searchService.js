/**
 * SOCCOS-AutoBot
 * Search Service (FINAL - FIXED)
 */

const index = require("./algoliaClient");
const queryProcessor = require("../engine/processors/queryProcessor");

/**
 * SEARCH PRODUCTS
 */
async function searchProducts(rawQuery) {
  try {
    /**
     * STEP 1 — PROCESS QUERY
     */
    const query = queryProcessor(rawQuery);

    if (!query) return [];

    console.log("🔍 Query:", query);

    /**
     * STEP 2 — ALGOLIA SEARCH
     */
    const response = await index.search(query, {
      hitsPerPage: 5,
    });

    const hits = response?.hits || [];

    /**
     * STEP 3 — NORMALIZE RESULTS
     */
    const products = hits.map((hit) => ({
      id: hit.objectID || "",
      name: hit.name || hit.title || "Product",
      price: hit.price || hit.sale_price || "",
      image: hit.image || hit.thumbnail || "",
      url: hit.url || hit.product_url || "",
    }));

    return products;

  } catch (error) {
    console.error("❌ Search Error:", error.message);
    return [];
  }
}

module.exports = {
  searchProducts,
};
