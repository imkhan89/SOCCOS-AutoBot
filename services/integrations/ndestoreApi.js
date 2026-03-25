/**
 * NDESTORE API INTEGRATION — CLEAN (LOGIC ONLY)
 * ---------------------------------------------
 * - No UI
 * - Central external API handler
 * - Supports product sync, search, stock, pricing
 * - Axios-based
 */

const axios = require("axios");
const logger = require("../../utils/logger");

// 🌐 Base Config
const BASE_URL = process.env.NDESTORE_API_URL;
const API_KEY = process.env.NDESTORE_API_KEY;

/**
 * 🔐 Axios Instance
 */
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
});

/**
 * 📦 SEARCH PRODUCTS
 */
async function searchProducts({ query, category, limit = 10 }) {
  try {
    const response = await api.get("/products/search", {
      params: { query, category, limit },
    });

    return response.data?.products || [];
  } catch (error) {
    logger.error("API Search Error:", error.message);
    return [];
  }
}

/**
 * 🔍 GET PRODUCT BY ID
 */
async function getProductById(id) {
  try {
    const response = await api.get(`/products/${id}`);

    return response.data?.product || null;
  } catch (error) {
    logger.error("API Get Product Error:", error.message);
    return null;
  }
}

/**
 * 🔎 GET PRODUCT BY SKU
 */
async function getProductBySKU(sku) {
  try {
    const response = await api.get(`/products/sku/${sku}`);

    return response.data?.product || null;
  } catch (error) {
    logger.error("API SKU Error:", error.message);
    return null;
  }
}

/**
 * 📊 GET STOCK
 */
async function getStock(productId) {
  try {
    const response = await api.get(`/products/${productId}/stock`);

    return response.data?.stock ?? 0;
  } catch (error) {
    logger.error("API Stock Error:", error.message);
    return 0;
  }
}

/**
 * 💰 GET PRICE
 */
async function getPrice(productId) {
  try {
    const response = await api.get(`/products/${productId}/price`);

    return response.data?.price ?? 0;
  } catch (error) {
    logger.error("API Price Error:", error.message);
    return 0;
  }
}

module.exports = {
  searchProducts,
  getProductById,
  getProductBySKU,
  getStock,
  getPrice,
};
