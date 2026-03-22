/**
 * SOCCOS-AutoBot
 * FINAL Message Pipeline (Sales Optimized)
 * ----------------------------------------
 */

const whatsappService = require('../services/whatsappService');
const intentMapper = require('../engine/semantic/intentMapper');
const queryProcessor = require('../engine/processors/queryProcessor');
const sessionMemory = require('../data/memory/sessionMemory');
const searchService = require('../search/searchService');
const responseGenerator = require('../ai/responseGenerator');

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
         * STEP 2 — Load session
         */
        const session = sessionMemory.getSession(from);

        /**
         * STEP 3 — Detect intent
         */
        const { intent, confidence } = intentMapper.mapIntent(text);

        console.log('🧠 Intent:', intent, '| Confidence:', confidence);

        /**
         * STEP 4 — Update session
         */
        sessionMemory.updateSession(from, {
            lastIntent: intent,
            lastQuery: text
        });

        /**
         * STEP 5 — Route logic
         */
        let responseText;

        switch (intent) {
            case 'greeting':
                responseText = handleGreeting();
                break;

            case 'menu':
                responseText = handleMenu();
                break;

            case 'search':
                responseText = await handleSearch(text);
                break;

            case 'support':
                responseText = handleSupport();
                break;

            default:
                responseText = await handleFallback(text);
        }

        /**
         * STEP 6 — Send response
         */
        return await whatsappService.sendText(from, responseText);

    } catch (error) {
        console.error('❌ Pipeline Error:', error.message);

        return await whatsappService.sendText(
            from,
            'Something went wrong. Please try again later.'
        );
    }
}

/**
 * HANDLERS
 */

function handleGreeting() {
    return (
        'Welcome to NDES AutoBot 🚗\n\n' +
        'Find genuine auto parts in seconds.\n\n' +
        '👉 Type your car + part\n' +
        'Example: "Civic brake pads 2018"\n\n' +
        'Or type *menu* to explore.'
    );
}

/**
 * SALES-OPTIMIZED MENU
 */
function handleMenu() {
    return (
        '🚗 *NDES AutoBot*\n\n' +
        'What are you looking for today?\n\n' +
        '1️⃣ Search Auto Parts\n' +
        '2️⃣ Best Deals\n' +
        '3️⃣ Customer Support\n\n' +
        '💡 Example: "Civic brake pads 2018"\n\n' +
        '⚡ Fast delivery across Pakistan'
    );
}

/**
 * 🔥 UPGRADE 2 — GUIDED SELLING SEARCH
 */
async function handleSearch(text) {
    try {
        /**
         * STEP 1 — Process query
         */
        const processed = queryProcessor.processQuery(text);

        /**
         * STEP 2 — Search products
         */
        const searchResults = await searchService.searchProducts(
            processed.normalizedQuery
        );

        /**
         * STEP 3 — Generate AI response
         */
        const aiResponse = await responseGenerator.generateSearchResponse(
            searchResults
        );

        /**
         * 🔥 SALES CTA (KEY UPGRADE)
         */
        return (
            aiResponse +
            '\n\n👉 Reply with product number to order' +
            '\n👉 Or type *menu* for more options'
        );

    } catch (error) {
        console.error('❌ Search Handler Error:', error.message);
        return 'Error searching products. Please try again.';
    }
}

function handleSupport() {
    return (
        '🤝 Customer Support\n\n' +
        'Please describe your issue.\n' +
        'Our team will assist you shortly.'
    );
}

async function handleFallback(text) {
    return await responseGenerator.generateFallbackResponse(text);
}

module.exports = {
    processIncomingMessage
};
