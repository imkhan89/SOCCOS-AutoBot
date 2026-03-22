/**
 * SOCCOS-AutoBot
 * FINAL BULLETPROOF PIPELINE
 */

const whatsappService = require('../services/whatsappService');
const intentMapper = require('../engine/semantic/intentMapper');
const queryProcessor = require('../engine/processors/queryProcessor');
const sessionMemory = require('../data/memory/sessionMemory');
const searchService = require('../search/searchService');
const responseGenerator = require('../ai/responseGenerator');
const shopifyClient = require('../integrations/shopifyClient');
const logger = require('../utils/logger');

/**
 * MAIN PIPELINE
 */
async function processIncomingMessage({ from, text }) {
    try {
        if (!text) {
            return await whatsappService.sendText(from, 'Invalid message.');
        }

        /**
         * 🔥 ORDER FLOW FIRST
         */
        const orderFlowResponse = await handleOrderFlow(from, text);
        if (orderFlowResponse) {
            return await whatsappService.sendText(from, orderFlowResponse);
        }

        /**
         * INTENT
         */
        const { intent } = intentMapper.mapIntent(text);

        sessionMemory.updateSession(from, {
            lastIntent: intent,
            lastQuery: text
        });

        let response;

        switch (intent) {
            case 'search':
                response = await handleSearch(from, text);
                break;

            case 'order_select':
                response = await handleOrderSelection(from, text);
                break;

            default:
                response = 'Type your product (e.g., Civic brake pads)';
        }

        return await whatsappService.sendText(from, response);

    } catch (error) {
        logger.log('ERROR', 'Pipeline Error', error.message);
        return await whatsappService.sendText(from, 'System error.');
    }
}

/**
 * SEARCH
 */
async function handleSearch(userId, text) {
    const processed = queryProcessor.processQuery(text);

    const results = await searchService.searchProducts(
        processed.normalizedQuery
    );

    sessionMemory.updateSession(userId, {
        lastResults: results.products
    });

    const aiResponse = await responseGenerator.generateSearchResponse(results);

    return aiResponse + '\n\n👉 Reply with product number to order';
}

/**
 * SELECT PRODUCT
 */
async function handleOrderSelection(userId, text) {
    const session = sessionMemory.getSession(userId);

    const index = parseInt(text) - 1;

    if (!session.lastResults[index]) {
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
 * 🔥 BULLETPROOF ORDER FLOW
 */
async function handleOrderFlow(userId, text) {
    const session = sessionMemory.getSession(userId);
    const order = session.order;

    if (!order || !order.step) return null;

    /**
     * NAME VALIDATION
     */
    if (order.step === 'awaiting_name') {

        if (text.length < 3) {
            return '❌ Enter valid name.';
        }

        sessionMemory.updateSession(userId, {
            order: {
                ...order,
                step: 'awaiting_address',
                name: text
            }
        });

        return '📍 Enter full address:';
    }

    /**
     * ADDRESS + ORDER CREATION
     */
    if (order.step === 'awaiting_address') {

        if (text.length < 10) {
            return '❌ Enter complete address.';
        }

        /**
         * DUPLICATE PROTECTION
         */
        if (order.isProcessing) {
            return '⏳ Order already processing...';
        }

        /**
         * LOCK ORDER
         */
        sessionMemory.updateSession(userId, {
            order: {
                ...order,
                isProcessing: true
            }
        });

        /**
         * CREATE SHOPIFY ORDER
         */
        const shopifyOrder = await shopifyClient.createOrder({
            product: order.product,
            name: order.name,
            address: text
        });

        /**
         * SUCCESS
         */
        if (shopifyOrder) {

            logger.log('SUCCESS', 'Order Created', {
                userId,
                orderId: shopifyOrder.id
            });

            sessionMemory.clearSession(userId);

            return `✅ Order Confirmed\nOrder ID: ${shopifyOrder.id}`;
        }

        /**
         * FAIL SAFE
         */
        sessionMemory.clearSession(userId);

        return '⚠️ Order received. Team will confirm manually.';
    }

    return null;
}

module.exports = {
    processIncomingMessage
};
