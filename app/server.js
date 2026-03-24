/**
 * SAE-V2 SERVER (FINAL — STEP 10 ENABLED)
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

// ✅ STEP 10 — Recovery Engine
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
    },
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
    timestamp: new Date().toISOString(),
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
    error: "Route not found",
  });
});

/**
 * GLOBAL ERROR HANDLER
 */
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err?.message || err);

  return res.status(500).json({
    error: "Internal Server Error",
  });
});

/**
 * ✅ STEP 10 — RUN RECOVERY ENGINE (EVERY 60s)
 */
setInterval(() => {
  runAbandonedRecovery();
}, 60 * 1000); // every 1 minute

/**
 * START SERVER
 */
const PORT = env.app.port || 3000;

app.listen(PORT, () => {
  console.log("=================================");
  console.log("🚀 SAE-V2 SERVER STARTED");
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 Mode: ${env.app.nodeEnv}`);
  console.log("♻️ Recovery Engine: ACTIVE");
  console.log("=================================");
});
