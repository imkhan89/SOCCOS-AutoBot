/**
 * SOCCOS-AutoBot
 * Algolia Client
 * ----------------
 * Initializes Algolia connection
 */

const algoliasearch = require('algoliasearch');
const env = require('../config/env');

/**
 * Initialize Algolia client
 */
const client = algoliasearch(
    env.algolia.appId,
    env.algolia.apiKey
);

/**
 * Initialize index
 */
const index = client.initIndex(env.algolia.indexName);

module.exports = {
    client,
    index
};
