/**
 * SOCCOS-AutoBot
 * Intent Mapper
 */

function mapIntent(text = '') {
    const input = text.toLowerCase().trim();

    /**
     * ORDER SELECTION (number input)
     */
    if (/^\d+$/.test(input)) {
        return {
            intent: 'order_select',
            confidence: 0.95
        };
    }

    if (input.includes('hi') || input.includes('hello') || input.includes('salam')) {
        return { intent: 'greeting', confidence: 0.9 };
    }

    if (input === 'menu' || input.includes('options')) {
        return { intent: 'menu', confidence: 0.9 };
    }

    if (
        input.includes('price') ||
        input.includes('buy') ||
        input.includes('brake') ||
        input.includes('oil') ||
        input.includes('filter')
    ) {
        return { intent: 'search', confidence: 0.8 };
    }

    if (input.includes('help') || input.includes('support')) {
        return { intent: 'support', confidence: 0.8 };
    }

    return { intent: 'fallback', confidence: 0.5 };
}

module.exports = { mapIntent };
