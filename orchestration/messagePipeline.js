/**
 * SOCCOS-AutoBot
 * PIPELINE WITH BUTTON + LIST UI
 */

const whatsappService = require('../services/whatsappService');
const intentMapper = require('../engine/semantic/intentMapper');
const queryProcessor = require('../engine/processors/queryProcessor');
const sessionMemory = require('../data/memory/sessionMemory');
const searchService = require('../search/searchService');
const responseGenerator = require('../ai/responseGenerator');

/**
 * MAIN
 */
async function processIncomingMessage({ from, text }) {
    try {

        /**
         * ORDER FLOW FIRST
         */
        const orderFlowResponse = await handleOrderFlow(from, text);
        if (orderFlowResponse) {
            return whatsappService.sendText(from, orderFlowResponse);
        }

        const { intent } = intentMapper.mapIntent(text);

        switch (intent) {
            case 'menu':
                return sendMenu(from);

            case 'search':
                return handleSearch(from, text);

            case 'order_select':
                return handleOrderSelection(from, text);

            default:
                return whatsappService.sendText(
                    from,
                    'Type product name (e.g., Civic brake pads)'
                );
        }

    } catch (error) {
        return whatsappService.sendText(from, 'System error.');
    }
}

/**
 * 🔥 BUTTON MENU
 */
async function sendMenu(userId) {
    return whatsappService.sendButtons(
        userId,
        '🚗 NDES AutoBot\nChoose an option:',
        [
            { id: 'search', title: 'Search Parts' },
            { id: 'support', title: 'Support' }
        ]
    );
}

/**
 * 🔥 LIST UI FOR PRODUCTS
 */
async function handleSearch(userId, text) {
    const processed = queryProcessor.processQuery(text);

    const results = await searchService.searchProducts(
        processed.normalizedQuery
    );

    sessionMemory.updateSession(userId, {
        lastResults: results.products
    });

    /**
     * Convert products → list format
     */
    const sections = [
        {
            title: 'Available Products',
            rows: results.products.map((p, i) => ({
                id: `${i + 1}`,
                title: p.name,
                description: `Rs ${p.price}`
            }))
        }
    ];

    return whatsappService.sendList(
        userId,
        'Select a product to order:',
        sections
    );
}

/**
 * HANDLE SELECTION
 */
async function handleOrderSelection(userId, text) {
    const session = sessionMemory.getSession(userId);

    const index = parseInt(text) - 1;

    if (!session.lastResults[index]) {
        return whatsappService.sendText(userId, 'Invalid selection.');
    }

    const product = session.lastResults[index];

    sessionMemory.updateSession(userId, {
        order: {
            step: 'awaiting_name',
            product
        }
    });

    return whatsappService.sendText(
        userId,
        `Selected: ${product.name}\nEnter your name:`
    );
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
            order: { ...order, step: 'awaiting_address', name: text }
        });
        return 'Enter address:';
    }

    if (order.step === 'awaiting_address') {
        sessionMemory.clearSession(userId);
        return '✅ Order placed!';
    }

    return null;
}

module.exports = { processIncomingMessage };
