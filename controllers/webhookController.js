/**
 * SOCCOS-AutoBot
 * Webhook Controller
 * -------------------
 * Handles:
 * - Meta webhook verification
 * - Incoming WhatsApp messages
 */

const env = require('../config/env');

/**
 * GET /webhook
 * Meta verification endpoint
 */
exports.verifyWebhook = (req, res) => {
    try {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === env.whatsapp.verifyToken) {
            console.log('✅ Webhook verified successfully');
            return res.status(200).send(challenge);
        } else {
            console.error('❌ Webhook verification failed');
            return res.sendStatus(403);
        }
    } catch (error) {
        console.error('❌ Verification Error:', error);
        return res.sendStatus(500);
    }
};

/**
 * POST /webhook
 * Incoming messages handler
 */
exports.handleWebhook = (req, res) => {
    try {
        const body = req.body;

        // Basic validation
        if (body.object) {
            console.log('📩 Incoming webhook event received');

            // TODO: Later → pass to messagePipeline

            return res.sendStatus(200);
        }

        return res.sendStatus(404);

    } catch (error) {
        console.error('❌ Webhook Processing Error:', error);
        return res.sendStatus(500);
    }
};
