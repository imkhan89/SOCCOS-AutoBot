/**
 * SOCCOS-AutoBot
 * Intent Mapper
 * ----------------
 * Detects user intent from text
 * Rule-based (Phase 1)
 */

/**
 * Map user message to intent
 */
function mapIntent(text = '') {
    const input = text.toLowerCase().trim();

    /**
     * GREETING
     */
    if (
        input.includes('hi') ||
        input.includes('hello') ||
        input.includes('salam')
    ) {
        return {
            intent: 'greeting',
            confidence: 0.9
        };
    }

    /**
     * MENU
     */
    if (
        input === 'menu' ||
        input.includes('options') ||
        input.includes('start')
    ) {
        return {
            intent: 'menu',
            confidence: 0.9
        };
    }

    /**
     * SEARCH / PRODUCT QUERY
     */
    if (
        input.includes('price') ||
        input.includes('buy') ||
        input.includes('available') ||
        input.includes('filter') ||
        input.includes('brake') ||
        input.includes('oil') ||
        input.includes('plug')
    ) {
        return {
            intent: 'search',
            confidence: 0.8
        };
    }

    /**
     * SUPPORT
     */
    if (
        input.includes('help') ||
        input.includes('support') ||
        input.includes('issue')
    ) {
        return {
            intent: 'support',
            confidence: 0.8
        };
    }

    /**
     * FALLBACK
     */
    return {
        intent: 'fallback',
        confidence: 0.5
    };
}

module.exports = {
    mapIntent
};
