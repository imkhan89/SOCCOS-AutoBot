/**
 * SOCCOS-AutoBot
 * Webhook Routes (FINAL — CLEAN)
 */

const express = require("express");
const router = express.Router();

const webhookController = require("../controllers/webhookController");

/**
 * GET /webhook
 * Meta verification
 */
router.get("/", webhookController.verifyWebhook);

/**
 * POST /webhook
 * Incoming WhatsApp messages
 */
router.post("/", webhookController.handleWebhook);

module.exports = router;
