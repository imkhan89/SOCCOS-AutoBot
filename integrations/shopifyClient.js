/**
 * SOCCOS-AutoBot
 * Shopify Client (FINAL — HARDENED)
 */

const axios = require("axios");
const env = require("../config/env");

const BASE_URL = `https://${env.shopify.storeUrl}/admin/api/2024-01`;

const headers = {
  "X-Shopify-Access-Token": env.shopify.accessToken,
  "Content-Type": "application/json",
};

/**
 * 🔍 SEARCH PRODUCTS (HARDENED)
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

    const keywords = query
      .toLowerCase()
      .trim()
      .split(" ")
      .filter(Boolean);

    const filtered = products.filter((p) => {
      const title = (p.title || "").toLowerCase();
      const tags = (p.tags || "").toLowerCase();
      const type = (p.product_type || "").toLowerCase();
      const vendor = (p.vendor || "").toLowerCase();

      const searchableText = `${title} ${tags} ${type} ${vendor}`;

      return keywords.some((word) => searchableText.includes(word));
    });

    console.log("🔍 Query:", query);
    console.log("✅ Matched:", filtered.length);

    // ✅ FALLBACK (CRITICAL)
    if (filtered.length === 0) {
      console.warn("⚠️ No match → returning default products");
      return products.slice(0, 5);
    }

    return filtered;

  } catch (error) {
    console.error("❌ Shopify Search Error:", error.message);
    return [];
  }
}

/**
 * 🛒 CREATE ORDER (HARDENED)
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
          first_name: orderData.name || "Customer",
        },
        shipping_address: {
          address1: orderData.address || "N/A",
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

    console.log("✅ Shopify Order Created:", response.data.order.id);

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
