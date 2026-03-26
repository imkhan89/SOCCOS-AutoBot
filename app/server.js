/**
 * SAE-V2 SERVER (FINAL — PRODUCTION SAFE)
 */

const express = require("express");
require("dotenv").config();
const env = require("../config/env");

// Routes
const webhookRoutes = require("../routes/webhookRoutes");

// Monitoring
const { getHealthStatus } = require("../services/monitoring/healthMonitor");

// Recovery Engine
const { runAbandonedRecovery } = require("../services/recovery/abandonedCart");

const app = express();

/**
 * GLOBAL MIDDLEWARE
 */
app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    }
  })
);

app.use(express.urlencoded({ extended: true }));

/**
 * HEALTH CHECKS
 */
app.get("/", (req, res) => {
  return res.status(200).send("SAE-V2 Server Running");
});

app.get("/health", (req, res) => {
  return res.status(200).json({
    status: "OK",
    service: "SAE-V2",
    timestamp: new Date().toISOString()
  });
});

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
 * RECOVERY ENGINE
 */
setInterval(() => {
  try {
    runAbandonedRecovery();
  } catch (e) {}
}, 60 * 1000);

/**
 * START SERVER
 */
const PORT = process.env.PORT || env?.app?.port || 3000;

app.listen(PORT);
