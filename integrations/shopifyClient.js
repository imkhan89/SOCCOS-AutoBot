/**
 * SOCCOS-AutoBot
 * Shopify Client (Optional)
 * --------------------------
 * Basic Shopify integration stub
 */

const axios = require('axios');
const env = require('../config/env');

/**
 * Check if Shopify is configured
 */
function isShopifyConfigured() {
    return env.shopify.storeUrl && env.shopify.accessToken;
}

/**
 * Fetch products (basic example)
 */
async function fetchProducts() {
    try {
        if (!isShopifyConfigured()) {
            console.warn('⚠️ Shopify not configured');
            return [];
        }

        const url = `https://${env.shopify.storeUrl}/admin/api/2023-10/products.json`;

        const response = await axios.get(url, {
            headers: {
                'X-Shopify-Access-Token': env.shopify.accessToken,
                'Content-Type': 'application/json'
            }
        });

        return response.data.products || [];

    } catch (error) {
        console.error('❌ Shopify Fetch Error:', error.message);
        return [];
    }
}

module.exports = {
    fetchProducts,
    isShopifyConfigured
};
