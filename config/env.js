/**
 * SOCCOS-AutoBot
 * Environment Configuration Loader
 * ---------------------------------
 * Centralized environment management
 * Validates all required variables
 */

require('dotenv').config();

/**
 * Helper to safely fetch environment variables
 */
function getEnv(key, required = true) {
    const value = process.env[key];

    if (!value && required) {
        console.error(`❌ Missing required environment variable: ${key}`);
        process.exit(1);
    }

    return value;
}

/**
 * Environment Configuration Object
 */
const env = {
    app: {
        port: getEnv('PORT', false) || 3000,
        nodeEnv: getEnv('NODE_ENV', false) || 'development',
    },

    whatsapp: {
        token: getEnv('WHATSAPP_TOKEN'),
        phoneNumberId: getEnv('WHATSAPP_PHONE_NUMBER_ID'),
        verifyToken: getEnv('WHATSAPP_VERIFY_TOKEN'),
        apiVersion: getEnv('WHATSAPP_API_VERSION', false) || 'v18.0',
    },

    openai: {
        apiKey: getEnv('OPENAI_API_KEY'),
        model: getEnv('OPENAI_MODEL', false) || 'gpt-4o-mini',
    },

    algolia: {
        appId: getEnv('ALGOLIA_APP_ID'),
        apiKey: getEnv('ALGOLIA_API_KEY'),
        indexName: getEnv('ALGOLIA_INDEX_NAME'),
    },

    shopify: {
        storeUrl: getEnv('SHOPIFY_STORE_URL', false),
        accessToken: getEnv('SHOPIFY_ACCESS_TOKEN', false),
    },
};

/**
 * Freeze config to prevent mutation
 */
Object.freeze(env);

module.exports = env;
