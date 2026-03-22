/**
 * SOCCOS-AutoBot
 * FINAL Message Pipeline WITH ORDER SYSTEM
 */

const whatsappService = require('../services/whatsappService');
const intentMapper = require('../engine/semantic/intentMapper');
const queryProcessor = require('../engine/processors/queryProcessor');
const sessionMemory = require('../data/memory/sessionMemory');
const searchService = require('../search/searchService');
const responseGenerator = require('../ai/responseGenerator');

/**
 * MAIN PIPELINE
 */
async function processIncomingMessage({ from, text }) {
    try {
        console.log('📩 Incoming:', { from, text });

        if (!text) {
            return await whatsappService.sendText(from, 'Message not understood.');
        }

        /**
         * 🔥 ORDER FLOW CHECK (PRIORITY)
         */
        const orderFlowResponse = await handleOrderFlow(from, text);
        if (orderFlowResponse) {
            return await whatsappService.sendText(from, orderFlowResponse);
        }

        /**
         * INTENT DETECTION
         */
        const { intent } = intentMapper.mapIntent(text);

        /**
         * SAVE SESSION
         */
        sessionMemory.updateSession(from, {
            lastIntent: intent,
            lastQuery: text
        });

        let responseText;

        switch (intent) {
            case 'greeting':
                responseText = handleGreeting();
                break;

            case 'menu':
                responseText = handleMenu();
                break;

            case 'search':
                responseText = await handleSearch(from, text);
                break;

            case 'order_select':
                responseText = await handleOrderSelection(from, text);
                break;

            case 'support':
                responseText = handleSupport();
                break;

            default:
                responseText = await handleFallback(text);
        }

        return await whatsappService.sendText(from, responseText);

    } catch (error) {
        console.error('❌ Pipeline Error:', error.message);
        return await whatsappService.sendText(from, 'System error.');
    }
}

/**
 * HANDLERS
 */

function handleGreeting() {
    return 'Welcome to NDES AutoBot 🚗\nType your car + part.';
}

function handleMenu() {
    return 'Menu:\n1. Search Parts\n2. Support';
}

/**
 * SEARCH HANDLER
 */
async function handleSearch(userId, text) {
    const processed = queryProcessor.processQuery(text);

    const results = await searchService.searchProducts(
        processed.normalizedQuery
    );

    /**
     * 🔥 STORE RESULTS
     */
    sessionMemory.updateSession(userId, {
        lastResults: results.products
    });

    const aiResponse = await responseGenerator.generateSearchResponse(results);

    return (
        aiResponse +
        '\n\n👉 Reply with product number to order'
    );
}

/**
 * ORDER SELECTION
 */
async function handleOrderSelection(userId, text) {
    const session = sessionMemory.getSession(userId);

    const index = parseInt(text) - 1;

    if (!session.lastResults || !session.lastResults[index]) {
        return 'Invalid selection.';
    }

    const product = session.lastResults[index];

    sessionMemory.updateSession(userId, {
        order: {
            step: 'awaiting_name',
            product
        }
    });

    return `Selected: ${product.name}\nEnter your name:`;
}

/**
 * ORDER FLOW
 */
async function handleOrderFlow(userId, text) {
    const session = sessionMemory.getSession(userId);
    const order = session.order;

    if (!order || !order.step) return null;

    if (order.step === 'awaiting_name') {
        sessionMemory.updateSession(userId, {
            order: {
                ...order,
                step: 'awaiting_address',
                name: text
            }
        });

        return 'Enter your address:';
    }

    if (order.step === 'awaiting_address') {
        sessionMemory.updateSession(userId, {
            order: {
                ...order,
                step: 'confirmed',
                address: text
            }
        });

        return (
            `✅ Order Confirmed\n\n` +
            `Product: ${order.product.name}\n` +
            `Name: ${order.name}\n` +
            `Address: ${text}`
        );
    }

    return null;
}

function handleSupport() {
    return 'Support will contact you.';
}

async function handleFallback(text) {
    return await responseGenerator.generateFallbackResponse(text);
}

module.exports = { processIncomingMessage };
