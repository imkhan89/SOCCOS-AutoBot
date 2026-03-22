/**
 * SOCCOS-AutoBot
 * Webhook Routes
 * ----------------
 * Handles:
 * - Meta verification (GET)
 * - Incoming messages (POST)
 */

const express = require('express');
const router = express.Router();

// Controller (will be created next)
const webhookController = require('../controllers/webhookController');

/**
 * GET /webhook
 * Meta verification endpoint
 */
router.get('/', webhookController.verifyWebhook);

/**
 * POST /webhook
 * Incoming messages from WhatsApp
 */
router.post('/', webhookController.handleWebhook);

module.exports = router;
