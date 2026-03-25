/**
 * SHOPIFY CLIENT — FULL CATALOG (FINAL)
 * -------------------------------------
 * - Fetches ALL products using pagination
 * - NO filtering here
 * - Clean structured output
 */

const axios = require("axios");
const env = require("../config/env");

const BASE_URL = `https://${env.shopify.storeUrl}/admin/api/2024-01`;

const headers = {
  "X-Shopify-Access-Token": env.shopify.accessToken,
  "Content-Type": "application/json",
};

/**
 * 🔥 FETCH ALL PRODUCTS (PAGINATION — CRITICAL)
 */
async function fetchAllProducts() {
  try {
    if (!env.shopify.storeUrl || !env.shopify.accessToken) {
      console.warn("⚠️ Shopify not configured");
      return [];
    }

    let allProducts = [];
    let url = `${BASE_URL}/products.json?limit=250`;

    while (url) {
      const response = await axios.get(url, { headers });

      const products = response.data.products || [];

      allProducts.push(...products);

      // 🔥 Handle pagination
      const linkHeader = response.headers.link;

      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextLink = linkHeader
          .split(",")
          .find(l => l.includes('rel="next"'))
          .match(/<(.+)>/)[1];

        url = nextLink;
      } else {
        url = null;
      }
    }

    console.log("🧾 Total Shopify Products:", allProducts.length);

    /**
     * ✅ NORMALIZE OUTPUT
     */
    return allProducts.map((p) => ({
      id: p.id,
      title: p.title,
      body_html: p.body_html,
      vendor: p.vendor,
      product_type: p.product_type,
      tags: p.tags,
      price: p.variants?.[0]?.price || 0,
      image: p.image?.src || null,
      sku: p.variants?.[0]?.sku || "",
      stock: p.variants?.[0]?.inventory_quantity || 0,
      variants: p.variants || [],
    }));

  } catch (error) {
    console.error("❌ Shopify Fetch Error:", error.message);
    return [];
  }
}

/**
 * 🛒 CREATE ORDER (UNCHANGED)
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
  fetchAllProducts,
  createOrder,
};
