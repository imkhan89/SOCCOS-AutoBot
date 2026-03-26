/**
 * ENV CONFIG — UPDATED (STRICT + SAFE)
 */

require("dotenv").config();

/**
 * 🔒 SAFE ENV FETCH
 */
function getEnv(key, { required = false, defaultValue = null } = {}) {
  const value = process.env[key];

  if (!value) {
    if (required) {
      console.error(`ENV Missing: ${key}`);
    }
    return defaultValue;
  }

  return value;
}

/**
 * 🔍 VALIDATE GROUP
 */
function validateGroup(name, obj, requiredKeys = []) {
  requiredKeys.forEach((key) => {
    if (!obj[key]) {
      console.error(`ENV ${name} Missing: ${key}`);
    }
  });
}

/**
 * CONFIG
 */
const env = {
  app: {
    port: Number(getEnv("PORT", { defaultValue: 3000 })),
    nodeEnv: getEnv("NODE_ENV", { defaultValue: "development" }),
  },

  whatsapp: {
    token: getEnv("WHATSAPP_TOKEN", { required: true }),
    phoneNumberId: getEnv("WHATSAPP_PHONE_NUMBER_ID", { required: true }),
    verifyToken: getEnv("WHATSAPP_VERIFY_TOKEN", { required: true }),
    apiVersion: getEnv("WHATSAPP_API_VERSION", { defaultValue: "v18.0" }),
  },

  openai: {
    apiKey: getEnv("OPENAI_API_KEY"),
    model: getEnv("OPENAI_MODEL", { defaultValue: "gpt-4o-mini" }),
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

/**
 * 🔍 VALIDATION (CRITICAL GROUPS)
 */
validateGroup("WHATSAPP", env.whatsapp, [
  "token",
  "phoneNumberId",
  "verifyToken",
]);

Object.freeze(env);

module.exports = env;
