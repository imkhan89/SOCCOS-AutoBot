/**
 * SOCCOS-AutoBot
 * FINAL Message Pipeline WITH ORDER + SHOPIFY INTEGRATION
 */

const whatsappService = require('../services/whatsappService');
const intentMapper = require('../engine/semantic/intentMapper');
const queryProcessor = require('../engine/processors/queryProcessor');
const sessionMemory = require('../data/memory/sessionMemory');
const searchService = require('../search/searchService');
const responseGenerator = require('../ai/responseGenerator');
const shopifyClient = require('../integrations/shopifyClient');

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
         * 🔥 ORDER FLOW PRIORITY
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
        'Type your car + part\n' +
        'Example: Civic brake pads 2018\n\n' +
        'Or type *menu*'
    );
}

function handleMenu() {
    return (
        '🚗 *NDES AutoBot*\n\n' +
        '1️⃣ Search Auto Parts\n' +
        '2️⃣ Customer Support\n\n' +
        '💡 Example: Civic oil filter'
    );
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
     * STORE RESULTS FOR ORDER SELECTION
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
 * PRODUCT SELECTION
 */
async function handleOrderSelection(userId, text) {
    const session = sessionMemory.getSession(userId);

    const index = parseInt(text) - 1;

    if (!session.lastResults || !session.lastResults[index]) {
        return 'Invalid selection. Please try again.';
    }

    const product = session.lastResults[index];

    sessionMemory.updateSession(userId, {
        order: {
            step: 'awaiting_name',
            product
        }
    });

    return (
        `🛒 Selected:\n${product.name}\n\n` +
        'Please enter your name:'
    );
}

/**
 * 🔥 ORDER FLOW WITH SHOPIFY
 */
async function handleOrderFlow(userId, text) {
    const session = sessionMemory.getSession(userId);
    const order = session.order;

    if (!order || !order.step) return null;

    /**
     * STEP 1 — NAME
     */
    if (order.step === 'awaiting_name') {
        sessionMemory.updateSession(userId, {
            order: {
                ...order,
                step: 'awaiting_address',
                name: text
            }
        });

        return '📍 Please enter your delivery address:';
    }

    /**
     * STEP 2 — ADDRESS + SHOPIFY ORDER
     */
    if (order.step === 'awaiting_address') {

        // Save address
        sessionMemory.updateSession(userId, {
            order: {
                ...order,
                step: 'confirmed',
                address: text
            }
        });

        /**
         * 🔥 CREATE SHOPIFY ORDER
         */
        const shopifyOrder = await shopifyClient.createOrder({
            product: order.product,
            name: order.name,
            address: text
        });

        /**
         * SUCCESS RESPONSE
         */
        if (shopifyOrder) {
            return (
                `✅ *Order Confirmed!*\n\n` +
                `🆔 Order ID: ${shopifyOrder.id}\n` +
                `Product: ${order.product.name}\n\n` +
                `🚚 Cash on Delivery\n` +
                `Our team will contact you shortly.`
            );
        }

        /**
         * FALLBACK RESPONSE
         */
        return (
            `✅ Order Received!\n\n` +
            `Product: ${order.product.name}\n\n` +
            `Our team will contact you shortly.`
        );
    }

    return null;
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
