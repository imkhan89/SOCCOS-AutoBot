/**
 * SOCCOS-AutoBot
 * Message Pipeline (Core Brain)
 * -----------------------------
 * Controls full message lifecycle
 */

const whatsappService = require('../services/whatsappService');
const intentMapper = require('../engine/semantic/intentMapper');

/**
 * Main pipeline handler
 */
async function processIncomingMessage({ from, text }) {
    try {
        console.log('📩 Incoming Message:', { from, text });

        /**
         * STEP 1 — Validate input
         */
        if (!text) {
            return await whatsappService.sendText(
                from,
                'Sorry, I could not understand your message.'
            );
        }

        /**
         * STEP 2 — Detect intent
         */
        const { intent, confidence } = intentMapper.mapIntent(text);

        console.log('🧠 Intent Detected:', { intent, confidence });

        /**
         * STEP 3 — Route based on intent
         */
        let response;

        switch (intent) {
            case 'greeting':
                response = handleGreeting();
                break;

            case 'menu':
                response = handleMenu();
                break;

            case 'search':
                response = handleSearch(text);
                break;

            case 'support':
                response = handleSupport();
                break;

            default:
                response = handleFallback(text);
        }

        /**
         * STEP 4 — Send response
         */
        return await whatsappService.sendText(from, response);

    } catch (error) {
        console.error('❌ Pipeline Error:', error.message);

        return await whatsappService.sendText(
            from,
            'Something went wrong. Please try again later.'
        );
    }
}

/**
 * INTENT HANDLERS
 */

function handleGreeting() {
    return 'Welcome to NDES AutoBot 🚗\nHow can I assist you today?\n\nType *menu* to explore options.';
}

function handleMenu() {
    return (
        'Main Menu:\n\n' +
        '1. Search Auto Parts\n' +
        '2. Browse Categories\n' +
        '3. Customer Support\n\n' +
        'Reply with a number or type your query.'
    );
}

function handleSearch(text) {
    return `🔍 Searching for: "${text}"\n\n(Search system will be connected next 🚀)`;
}

function handleSupport() {
    return 'Our support team will assist you shortly.\nPlease describe your issue.';
}

function handleFallback(text) {
    return `I didn’t fully understand: "${text}"\n\nType *menu* to see available options.`;
}

module.exports = {
    processIncomingMessage
};
