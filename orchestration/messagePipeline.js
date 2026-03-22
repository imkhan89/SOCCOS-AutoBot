/**
 * SOCCOS-AutoBot
 * Message Pipeline (Core Brain)
 * -----------------------------
 * Controls full message lifecycle
 */

const whatsappService = require('../services/whatsappService');

/**
 * Main pipeline handler
 */
async function processIncomingMessage({ from, text }) {
    try {
        console.log('📩 Incoming Message:', { from, text });

        /**
         * STEP 1 — Basic validation
         */
        if (!text) {
            return await whatsappService.sendText(
                from,
                'Sorry, I could not understand your message.'
            );
        }

        /**
         * STEP 2 — TEMPORARY RESPONSE (until intent layer is built)
         */
        const responseText = generateTemporaryResponse(text);

        /**
         * STEP 3 — Send response
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
 * Temporary response generator (will be replaced later)
 */
function generateTemporaryResponse(text) {
    const lower = text.toLowerCase();

    if (lower.includes('hi') || lower.includes('hello')) {
        return 'Welcome to NDES AutoBot 🚗\nHow can I help you today?';
    }

    if (lower.includes('menu')) {
        return 'Main Menu:\n1. Search Parts\n2. Browse Categories\n3. Support';
    }

    return `You said: "${text}"\n\n(Full AI + search coming next phase 🚀)`;
}

module.exports = {
    processIncomingMessage
};
