/**
 * SOCCOS-AutoBot
 * OpenAI Client
 * ----------------
 * Initializes OpenAI connection
 */

const OpenAI = require('openai');
const env = require('../config/env');

/**
 * Initialize OpenAI client
 */
const client = new OpenAI({
    apiKey: env.openai.apiKey
});

module.exports = client;
