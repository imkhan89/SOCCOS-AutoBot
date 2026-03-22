/**
 * SOCCOS-AutoBot
 * Environment Config (FINAL - PRODUCTION SAFE)
 */

require("dotenv").config();

/**
 * SAFE ENV FETCH (NO CRASH)
 */
function getEnv(key, required = false) {
  const value = process.env[key];

  if (!value && required) {
    console.warn(`⚠️ Missing env: ${key}`);
  }

  return value || null;
}

/**
 * CONFIG
 */
const env = {
  app: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
  },

  whatsapp: {
    token: getEnv("WHATSAPP_TOKEN", true),
    phoneNumberId: getEnv("WHATSAPP_PHONE_NUMBER_ID", true),
    verifyToken: getEnv("WHATSAPP_VERIFY_TOKEN", true),
    apiVersion: process.env.WHATSAPP_API_VERSION || "v18.0",
  },

  // OPTIONAL
  openai: {
    apiKey: getEnv("OPENAI_API_KEY"),
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  },

  algolia: {
    appId: getEnv("ALGOLIA_APP_ID"),
    apiKey: getEnv("ALGOLIA_API_KEY"),
    indexName: getEnv("ALGOLIA_INDEX_NAME"),
  },

  shopify: {
    storeUrl: getEnv("SHOPIFY_STORE_URL"),
    accessToken: getEnv("SHOPIFY_ACCESS_TOKEN"),
  },
};

Object.freeze(env);

module.exports = env;
