/**
 * SOCCOS-AutoBot
 * Shopify Client (Retry Enabled)
 */

const axios = require('axios');
const env = require('../config/env');

/**
 * Create Shopify Order with retry
 */
async function createOrder(orderData, retries = 2) {
    try {
        if (!env.shopify.storeUrl || !env.shopify.accessToken) {
            console.warn('⚠️ Shopify not configured');
            return null;
        }

        const url = `https://${env.shopify.storeUrl}/admin/api/2023-10/orders.json`;

        const payload = {
            order: {
                line_items: [
                    {
                        title: orderData.product.name,
                        price: orderData.product.price,
                        quantity: 1
                    }
                ],
                customer: {
                    first_name: orderData.name
                },
                shipping_address: {
                    address1: orderData.address,
                    country: "Pakistan"
                },
                financial_status: "pending"
            }
        };

        const response = await axios.post(url, payload, {
            headers: {
                'X-Shopify-Access-Token': env.shopify.accessToken,
                'Content-Type': 'application/json'
            }
        });

        return response.data.order;

    } catch (error) {
        if (retries > 0) {
            console.warn('🔁 Retrying Shopify order...');
            return createOrder(orderData, retries - 1);
        }

        console.error('❌ Shopify Failed:', error.message);
        return null;
    }
}

module.exports = {
    createOrder
};
