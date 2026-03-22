/**
 * SOCCOS-AutoBot
 * Core Express Server
 * -------------------
 * Initializes server, middleware, and routes
 */

const express = require('express');
const env = require('../config/env');

// Routes
const webhookRoutes = require('../routes/webhookRoutes');

// Initialize app
const app = express();

/**
 * GLOBAL MIDDLEWARE
 */

// Parse JSON body (WhatsApp requires raw JSON handling)
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));

// Parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

/**
 * HEALTH CHECK (IMPORTANT FOR DEPLOYMENT)
 */
app.get('/health', (req, res) => {
    return res.status(200).json({
        status: 'OK',
        service: 'SOCCOS-AutoBot',
        timestamp: new Date().toISOString()
    });
});

/**
 * ROUTES
 */
app.use('/webhook', webhookRoutes);

/**
 * 404 HANDLER
 */
app.use((req, res) => {
    return res.status(404).json({
        error: 'Route not found'
    });
});

/**
 * GLOBAL ERROR HANDLER
 */
app.use((err, req, res, next) => {
    console.error('❌ Global Error:', err);

    return res.status(500).json({
        error: 'Internal Server Error'
    });
});

/**
 * START SERVER
 */
const PORT = env.app.port;

app.listen(PORT, () => {
    console.log(`🚀 SOCCOS-AutoBot running on port ${PORT}`);
});
