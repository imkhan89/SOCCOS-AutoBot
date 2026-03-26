/**
 * SAE-V2 SERVER (FINAL — PRODUCTION SAFE)
 * --------------------------------
 * ✔ Webhook support
 * ✔ Health monitoring
 * ✔ Error handling
 * ✔ Abandoned cart recovery engine
 */

const express = require("express");
const env = require("../config/env");

// Routes
const webhookRoutes = require("../routes/webhookRoutes");

// Monitoring
const { getHealthStatus } = require("../services/monitoring/healthMonitor");

// Recovery Engine
const { runAbandonedRecovery } = require("../services/recovery/abandonedCart");

// Initialize app
const app = express();

/**
 * GLOBAL MIDDLEWARE
 */

// Parse JSON (retain raw body for webhook verification)
app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    }
  })
);

// Parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

/**
 * ROOT HEALTH CHECK
 */
app.get("/", (req, res) => {
  return res.status(200).send("SAE-V2 Server Running");
});

/**
 * BASIC HEALTH CHECK
 */
app.get("/health", (req, res) => {
  return res.status(200).json({
    status: "OK",
    service: "SAE-V2",
    timestamp: new Date().toISOString()
  });
});

/**
 * ADVANCED STATUS
 */
app.get("/status", (req, res) => {
  return res.status(200).json(getHealthStatus());
});

/**
 * ROUTES
 */
app.use("/webhook", webhookRoutes);

/**
 * 404 HANDLER
 */
app.use((req, res) => {
  return res.status(404).json({
    error: "Route not found"
  });
});

/**
 * GLOBAL ERROR HANDLER
 */
app.use((err, req, res, next) => {
  return res.status(500).json({
    error: "Internal Server Error"
  });
});

/**
 * RUN RECOVERY ENGINE (EVERY 60s)
 */
setInterval(() => {
  try {
    runAbandonedRecovery();
  } catch (e) {
    // silent fail-safe
  }
}, 60 * 1000);

/**
 * START SERVER
 */
const PORT = env?.app?.port || 3000;

app.listen(PORT);
