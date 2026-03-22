/**
 * SOCCOS-AutoBot
 * Webhook Controller
 * -------------------
 * Handles:
 * - Meta webhook verification
 * - Incoming WhatsApp messages → pipeline
 */

const env = require('../config/env');
const messagePipeline = require('../orchestration/messagePipeline');

/**
 * GET /webhook
 * Meta verification
 */
exports.verifyWebhook = (req, res) => {
    try {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === env.whatsapp.verifyToken) {
            console.log('✅ Webhook verified');
            return res.status(200).send(challenge);
        } else {
            console.error('❌ Verification failed');
            return res.sendStatus(403);
        }
    } catch (error) {
        console.error('❌ Verification Error:', error);
        return res.sendStatus(500);
    }
};

/**
 * POST /webhook
 * Incoming messages
 */
exports.handleWebhook = async (req, res) => {
    try {
        const body = req.body;

        /**
         * Validate WhatsApp payload
         */
        if (
            body.object &&
            body.entry &&
            body.entry[0]?.changes &&
            body.entry[0].changes[0]?.value?.messages
        ) {
            const message = body.entry[0].changes[0].value.messages[0];

            const from = message.from; // user phone number
            const text = message.text?.body;

            console.log('📥 Incoming:', { from, text });

            /**
             * Pass to pipeline
             */
            await messagePipeline.processIncomingMessage({
                from,
                text
            });

            return res.sendStatus(200);
        }

        return res.sendStatus(404);

    } catch (error) {
        console.error('❌ Webhook Error:', error.message);
        return res.sendStatus(500);
    }
};
