/**
 * SHOPIFY CLIENT — FINAL (STRICT + SILENT + PRODUCTION SAFE)
 */

const axios = require("axios");
const env = require("../config/env");

const BASE_URL = `https://${env?.shopify?.storeUrl}/admin/api/2024-01`;

const headers = {
  "X-Shopify-Access-Token": env?.shopify?.accessToken,
  "Content-Type": "application/json",
};

// CONFIG
const MAX_RETRIES = 2;
const TIMEOUT = 10000;

/**
 * ENV VALIDATION
 */
function isEnvValid() {
  return env?.shopify?.storeUrl && env?.shopify?.accessToken;
}

/**
 * GENERIC REQUEST WRAPPER (SILENT FAIL)
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
    return null;
  }
}

/**
 * FETCH ALL PRODUCTS
 */
async function fetchAllProducts() {
  try {
    if (!isEnvValid()) return [];

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
      title: p.title || "",
      body_html: p.body_html || "",
      vendor: p.vendor || "",
      product_type: p.product_type || "",
      tags: p.tags || "",
      price: Number(p.variants?.[0]?.price) || 0,
      image: p.image?.src || null,
      sku: p.variants?.[0]?.sku || "",
      stock: p.variants?.[0]?.inventory_quantity || 0,
      variants: Array.isArray(p.variants) ? p.variants : [],
    }));

  } catch (error) {
    return [];
  }
}

/**
 * GET PRODUCT BY ID
 */
async function getProductById(id) {
  try {
    if (!isEnvValid() || !id) return null;

    const response = await requestWithRetry({
      method: "GET",
      url: `${BASE_URL}/products/${id}.json`,
      headers,
    });

    const p = response?.data?.product;
    if (!p) return null;

    return {
      id: p.id,
      title: p.title || "",
      body_html: p.body_html || "",
      vendor: p.vendor || "",
      product_type: p.product_type || "",
      tags: p.tags || "",
      price: Number(p.variants?.[0]?.price) || 0,
      image: p.image?.src || null,
      sku: p.variants?.[0]?.sku || "",
      stock: p.variants?.[0]?.inventory_quantity || 0,
      variants: Array.isArray(p.variants) ? p.variants : [],
    };

  } catch (error) {
    return null;
  }
}

/**
 * OPTIONAL SKU FETCH (SAFE FALLBACK)
 */
async function getProductBySKU(sku) {
  try {
    if (!isEnvValid() || !sku) return null;

    const products = await fetchAllProducts();

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      if (
        Array.isArray(product.variants) &&
        product.variants.some(v => v.sku === sku)
      ) {
        return product;
      }
    }

    return null;

  } catch (error) {
    return null;
  }
}

/**
 * CREATE ORDER
 */
async function createOrder(orderData) {
  try {
    if (!isEnvValid()) return null;

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
    return null;
  }
}

module.exports = {
  fetchAllProducts,
  getProductById,
  getProductBySKU,
  createOrder,
};
