/**
 * SOCCOS-AutoBot
 * Search Service
 * ----------------
 * Handles product search via Algolia
 */

const { index } = require('./algoliaClient');
const queryProcessor = require('../engine/processors/queryProcessor');

/**
 * Search products
 */
async function searchProducts(rawQuery) {
    try {
        /**
         * STEP 1 — Process query
         */
        const processed = queryProcessor.processQuery(rawQuery);

        console.log('🔍 Processed Query:', processed.normalizedQuery);

        /**
         * STEP 2 — Search Algolia
         */
        const results = await index.search(processed.normalizedQuery, {
            hitsPerPage: 5
        });

        /**
         * STEP 3 — Format results (clean structure)
         */
        const products = results.hits.map(hit => ({
            id: hit.objectID,
            name: hit.name || hit.title,
            price: hit.price || hit.sale_price,
            image: hit.image || hit.thumbnail,
            url: hit.url || hit.product_url
        }));

        return {
            query: processed.normalizedQuery,
            total: results.nbHits,
            products
        };

    } catch (error) {
        console.error('❌ Search Error:', error.message);

        return {
            query: rawQuery,
            total: 0,
            products: []
        };
    }
}

module.exports = {
    searchProducts
};
