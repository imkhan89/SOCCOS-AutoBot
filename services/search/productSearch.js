/**
 * PRODUCT SEARCH SERVICE — FULL CATALOG (FINAL)
 * --------------------------------------------
 * - Fetches ALL Shopify products (via pagination)
 * - Caches products (fast)
 * - Token-based accurate search (NO wrong matches)
 */

const { fetchAllProducts } = require("../../integrations/shopifyClient");
const logger = require("../../utils/logger");

// 🧠 CACHE
let CACHE = [];
let LAST_FETCH = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

/**
 * 🔍 MAIN SEARCH
 */
async function search(input, options = {}) {
  try {
    let query = "";
    let limit = options.limit || 10;

    // ✅ Normalize input
    if (typeof input === "string") {
      query = input;
    } else if (typeof input === "object" && input !== null) {
      query = input.query || "";
      limit = input.limit || limit;
    }

    if (!query || typeof query !== "string") return [];

    const cleanedQuery = normalize(query);

    if (cleanedQuery.length < 2) return [];

    // 🔥 TOKENIZE
    const tokens = cleanedQuery
      .split(" ")
      .filter(t => t.length > 1);

    // 🔄 GET FULL PRODUCT LIST
    const products = await getProductsCached();

    // 🧠 FILTER
    const matched = products.filter(product =>
      matchProduct(product, tokens)
    );

    logger.info(`🔍 Query: ${cleanedQuery}`);
    logger.info(`🧾 Total Products: ${products.length}`);
    logger.info(`✅ Matched: ${matched.length}`);

    return matched.slice(0, limit);

  } catch (error) {
    logger.error("Search Error:", error.message);
    return [];
  }
}

/**
 * 🔒 MATCH LOGIC (STRICT)
 */
function matchProduct(product, tokens) {
  if (!product) return false;

  const text = buildSearchText(product);

  return tokens.every(token => text.includes(token));
}

/**
 * 🧠 BUILD SEARCH TEXT
 */
function buildSearchText(product) {
  return `
    ${product.title || ""}
    ${product.body_html || ""}
    ${product.vendor || ""}
    ${product.product_type || ""}
    ${product.tags || ""}
  `
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ");
}

/**
 * 🔄 CACHE HANDLER
 */
async function getProductsCached() {
  const now = Date.now();

  if (CACHE.length && now - LAST_FETCH < CACHE_TTL) {
    return CACHE;
  }

  const products = await fetchAllProducts();

  CACHE = Array.isArray(products) ? products : [];
  LAST_FETCH = now;

  return CACHE;
}

/**
 * 🧹 NORMALIZE
 */
function normalize(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, " ");
}

/**
 * 🔎 SKU SEARCH (UNCHANGED)
 */
async function searchBySKU(sku) {
  try {
    if (!sku || typeof sku !== "string") return null;

    const cleanedSKU = sku.trim();
    if (!cleanedSKU) return null;

    const product = CACHE.find(p =>
      (p.variants || []).some(v => v.sku === cleanedSKU)
    );

    return product || null;

  } catch (error) {
    logger.error("SKU Search Error:", error.message);
    return null;
  }
}

module.exports = {
  search,
  searchBySKU,
};
