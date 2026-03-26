/**
 * PRODUCT SEARCH SERVICE — FINAL (FUNNEL OPTIMIZED + STRICT + FAST)
 */

const { fetchAllProducts } = require("../../integrations/shopifyClient");
const logger = require("../../utils/logger");

// 🧠 CACHE
let CACHE = [];
let LAST_FETCH = 0;

const CACHE_TTL = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 10000;

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

    const tokens = cleanedQuery.split(" ").filter(t => t.length > 1);
    if (!tokens.length) return [];

    const products = await getProductsCached();

    const results = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      const score = scoreProduct(product, tokens);

      if (score > 0) {
        results.push({ product, score });
      }
    }

    // 🚀 SORT BY BEST MATCH
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit).map(r => r.product);

  } catch (error) {
    logger.error("SearchError", error);
    return [];
  }
}

/**
 * 🔥 ALIAS FOR PIPELINE COMPATIBILITY
 */
async function searchProducts(query, options = {}) {
  return await search(query, options);
}

/**
 * 🧠 SCORING ENGINE (CONVERSION OPTIMIZED)
 */
function scoreProduct(product, tokens) {
  if (!product || !tokens.length) return 0;

  const text = buildSearchText(product);
  const title = (product.title || "").toLowerCase();
  const tags = (product.tags || "").toLowerCase();

  let score = 0;
  let matchedTokens = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (title.includes(token)) {
      score += 5;
      matchedTokens++;
      continue;
    }

    if (tags.includes(token)) {
      score += 3;
      matchedTokens++;
      continue;
    }

    if (text.includes(token)) {
      score += 1;
      matchedTokens++;
    }
  }

  if (matchedTokens === 0) return 0;

  if (matchedTokens === tokens.length) {
    score += 5;
  }

  return score;
}

/**
 * 🧠 BUILD SEARCH TEXT
 */
function buildSearchText(product) {
  return (
    `${product.title || ""} ${product.body_html || ""} ${product.vendor || ""} ${product.product_type || ""} ${product.tags || ""}`
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
  );
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

  if (!Array.isArray(products)) {
    return CACHE;
  }

  CACHE = products.slice(0, MAX_CACHE_SIZE);
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

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      if (
        Array.isArray(product.variants) &&
        product.variants.some(v => v.sku === cleanedSKU)
      ) {
        return product;
      }
    }

    return null;

  } catch (error) {
    logger.error("SKUSearchError", error);
    return null;
  }
}

module.exports = {
  search,
  searchProducts, // ✅ FIXED EXPORT
  searchBySKU,
};
