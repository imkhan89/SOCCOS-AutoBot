/**
 * PRODUCT SEARCH SERVICE — FINAL (HIGH ACCURACY)
 * --------------------------------------------
 * - Full catalog (via Shopify pagination)
 * - Smart caching
 * - STRICT + WEIGHTED token matching
 */

const { fetchAllProducts } = require("../../integrations/shopifyClient");
const logger = require("../../utils/logger");

// 🧠 CACHE
let CACHE = [];
let LAST_FETCH = 0;
const CACHE_TTL = 5 * 60 * 1000;

/**
 * 🔍 MAIN SEARCH
 */
async function search(input, options = {}) {
  try {
    let query = "";
    let limit = options.limit || 10;

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

    const products = await getProductsCached();

    /**
     * 🧠 SCORE-BASED MATCHING (CRITICAL FIX)
     */
    const scored = products.map(product => {
      const score = scoreProduct(product, tokens);
      return { product, score };
    });

    // ✅ Keep only relevant
    const filtered = scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.product);

    logger.info(`🔍 Query: ${cleanedQuery}`);
    logger.info(`🧾 Total Products: ${products.length}`);
    logger.info(`✅ Matched: ${filtered.length}`);

    return filtered.slice(0, limit);

  } catch (error) {
    logger.error("Search Error:", error.message);
    return [];
  }
}

/**
 * 🧠 SCORING ENGINE (SMART MATCH)
 */
function scoreProduct(product, tokens) {
  if (!product) return 0;

  const text = buildSearchText(product);

  let score = 0;

  tokens.forEach(token => {
    if (text.includes(token)) {
      score += 2; // base match
    }
  });

  // 🔥 STRONG MATCH BOOST (title priority)
  const title = (product.title || "").toLowerCase();

  tokens.forEach(token => {
    if (title.includes(token)) {
      score += 3;
    }
  });

  // ❌ STRICT FILTER: ALL TOKENS MUST APPEAR AT LEAST ONCE
  const allMatch = tokens.every(token => text.includes(token));

  return allMatch ? score : 0;
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
 * 🔎 SKU SEARCH
 */
async function searchBySKU(sku) {
  try {
    if (!sku || typeof sku !== "string") return null;

    const cleanedSKU = sku.trim();
    if (!cleanedSKU) return null;

    const products = await getProductsCached();

    const product = products.find(p =>
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
