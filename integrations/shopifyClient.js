/**
 * SOCCOS-AutoBot
 * Shopify Client (FINAL — PRODUCTION READY)
 */

const axios = require("axios");
const env = require("../config/env");

const BASE_URL = `https://${env.shopify.storeUrl}/admin/api/2024-01`;

const headers = {
  "X-Shopify-Access-Token": env.shopify.accessToken,
  "Content-Type": "application/json",
};

/**
 * 🔍 SEARCH PRODUCTS (FINAL FIXED)
 */
async function searchProducts(query) {
  try {
    if (!env.shopify.storeUrl || !env.shopify.accessToken) {
      console.warn("⚠️ Shopify not configured");
      return [];
    }

    const response = await axios.get(`${BASE_URL}/products.json`, {
      headers,
      params: { limit: 50 },
    });

    const products = response.data.products || [];

    console.log("🧾 Total Shopify Products:", products.length);

    if (!query) return products;

    // ✅ CLEAN QUERY
    const keywords = query
      .toLowerCase()
      .trim()
      .split(" ")
      .filter(Boolean); // removes empty values

    const filtered = products.filter((p) => {
      const title = (p.title || "").toLowerCase();

      return keywords.some((word) => title.includes(word));
    });

    console.log("🔍 Search Query:", query);
    console.log("✅ Matched Products:", filtered.length);

    return filtered;

  } catch (error) {
    console.error("❌ Shopify Search Error:", error.message);
    return [];
  }
}

/**
 * 🛒 CREATE ORDER (FINAL SAFE)
 */
async function createOrder(orderData, retries = 2) {
  try {
    if (!env.shopify.storeUrl || !env.shopify.accessToken) {
      console.warn("⚠️ Shopify not configured");
      return null;
    }

    const variantId = orderData?.product?.variants?.[0]?.id;

    if (!variantId) {
      console.error("❌ Missing variant ID");
      return null;
    }

    const payload = {
      order: {
        line_items: [
          {
            variant_id: variantId,
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

    const response = await axios.post(
      `${BASE_URL}/orders.json`,
      payload,
      { headers }
    );

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
