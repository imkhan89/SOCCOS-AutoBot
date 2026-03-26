/**
 * SHOPIFY CLIENT — UPDATED (SAFE + CONTROLLED)
 */

const axios = require("axios");
const env = require("../config/env");

const BASE_URL = `https://${env?.shopify?.storeUrl}/admin/api/2024-01`;

const headers = {
  "X-Shopify-Access-Token": env?.shopify?.accessToken,
  "Content-Type": "application/json",
};

// 🔁 CONFIG
const MAX_RETRIES = 2;
const TIMEOUT = 10000;

/**
 * 🔒 ENV VALIDATION
 */
function isEnvValid() {
  return env?.shopify?.storeUrl && env?.shopify?.accessToken;
}

/**
 * 🔁 GENERIC REQUEST WRAPPER
 */
async function requestWithRetry(config, retries = MAX_RETRIES) {
  try {
    const response = await axios({
      ...config,
      timeout: TIMEOUT,
    });
    return response;
  } catch (error) {
    if (retries > 0) {
      return requestWithRetry(config, retries - 1);
    }
    console.error("ShopifyRequestError:", error?.message);
    return null;
  }
}

/**
 * 🔥 FETCH ALL PRODUCTS
 */
async function fetchAllProducts() {
  try {
    if (!isEnvValid()) {
      return [];
    }

    let allProducts = [];
    let url = `${BASE_URL}/products.json?limit=250`;

    while (url) {
      const response = await requestWithRetry({
        method: "GET",
        url,
        headers,
      });

      if (!response) break;

      const products = response?.data?.products || [];
      allProducts.push(...products);

      const linkHeader = response.headers?.link;

      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextLink = linkHeader
          .split(",")
          .find((l) => l.includes('rel="next"'))
          ?.match(/<(.+)>/)?.[1];

        url = nextLink || null;
      } else {
        url = null;
      }
    }

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
    console.error("ShopifyFetchError:", error.message);
    return [];
  }
}

/**
 * 🛒 CREATE ORDER
 */
async function createOrder(orderData) {
  try {
    if (!isEnvValid()) {
      return null;
    }

    const variantId = orderData?.product?.variants?.[0]?.id;
    if (!variantId) return null;

    const payload = {
      order: {
        line_items: [
          {
            variant_id: variantId,
            quantity: 1,
          },
        ],
        customer: {
          first_name: orderData?.name || "Customer",
        },
        shipping_address: {
          address1: orderData?.address || "N/A",
          country: "Pakistan",
        },
        financial_status: "pending",
      },
    };

    const response = await requestWithRetry({
      method: "POST",
      url: `${BASE_URL}/orders.json`,
      data: payload,
      headers,
    });

    return response?.data?.order || null;

  } catch (error) {
    console.error("ShopifyOrderError:", error.message);
    return null;
  }
}

module.exports = {
  fetchAllProducts,
  createOrder,
};
