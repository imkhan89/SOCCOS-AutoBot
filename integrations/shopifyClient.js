/**
 * SOCCOS-AutoBot
 * Shopify Client (FINAL — SEARCH + ORDER)
 */

const axios = require("axios");
const env = require("../config/env");

const BASE_URL = `https://${env.shopify.storeUrl}/admin/api/2024-01`;

const headers = {
  "X-Shopify-Access-Token": env.shopify.accessToken,
  "Content-Type": "application/json",
};

/**
 * 🔍 SEARCH PRODUCTS (NEW)
 */
async function searchProducts(query) {
  try {
    if (!env.shopify.storeUrl || !env.shopify.accessToken) {
      console.warn("⚠️ Shopify not configured");
      return [];
    }

    const response = await axios.get(`${BASE_URL}/products.json`, {
      headers,
      params: { limit: 20 },
    });

    const products = response.data.products || [];

    return products.filter((p) =>
      p.title.toLowerCase().includes(query.toLowerCase())
    );

  } catch (error) {
    console.error("❌ Shopify Search Error:", error.message);
    return [];
  }
}

/**
 * 🛒 CREATE ORDER (UPDATED — USE VARIANT ID)
 */
async function createOrder(orderData, retries = 2) {
  try {
    if (!env.shopify.storeUrl || !env.shopify.accessToken) {
      console.warn("⚠️ Shopify not configured");
      return null;
    }

    const url = `${BASE_URL}/orders.json`;

    const payload = {
      order: {
        line_items: [
          {
            variant_id: orderData.product.variants[0].id,
            quantity: 1,
          },
        ],
        customer: {
          first_name: orderData.name,
        },
        shipping_address: {
          address1: orderData.address,
          country: "Pakistan",
        },
        financial_status: "pending",
      },
    };

    const response = await axios.post(url, payload, { headers });

    return response.data.order;

  } catch (error) {
    if (retries > 0) {
      console.warn("🔁 Retrying Shopify order...");
      return createOrder(orderData, retries - 1);
    }

    console.error("❌ Shopify Failed:", error.message);
    return null;
  }
}

module.exports = {
  searchProducts,
  createOrder,
};
