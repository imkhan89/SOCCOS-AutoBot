/**
 * SOCCOS-AutoBot
 * Query Processor
 * ----------------
 * Cleans and normalizes user queries
 * Prepares for search layer
 */

/**
 * Process raw user query
 */
function processQuery(text = '') {
    const original = text;

    /**
     * STEP 1 — Normalize text
     */
    let cleaned = text
        .toLowerCase()
        .replace(/[^\w\s]/gi, '') // remove special characters
        .trim();

    /**
     * STEP 2 — Remove stop words
     */
    const stopWords = [
        'price',
        'buy',
        'need',
        'want',
        'for',
        'the',
        'a',
        'an',
        'please',
        'available',
        'in',
        'of'
    ];

    const tokens = cleaned
        .split(' ')
        .filter(word => !stopWords.includes(word));

    /**
     * STEP 3 — Automotive normalization
     */
    const synonyms = {
        'brakepad': 'brake pad',
        'brakes': 'brake',
        'oilfilter': 'oil filter',
        'airfilter': 'air filter',
        'sparkplug': 'spark plug'
    };

    const normalizedTokens = tokens.map(word => synonyms[word] || word);

    /**
     * STEP 4 — Rebuild query
     */
    const normalizedQuery = normalizedTokens.join(' ');

    /**
     * RETURN structured output
     */
    return {
        original,
        cleaned,
        tokens,
        normalizedQuery
    };
}

module.exports = {
    processQuery
};
