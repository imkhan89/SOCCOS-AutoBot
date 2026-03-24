/**
 * SAE-V2 SERVER (FINAL - HARDENED)
 * --------------------------------
 * Production-ready Express server
 */

const express = require("express");
const env = require("../config/env");

// Routes
const webhookRoutes = require("../routes/webhookRoutes");

// Initialize app
const app = express();

/**
 * GLOBAL MIDDLEWARE
 */

// Parse JSON (retain raw body for webhook verification if needed)
app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

// Parse URL-encoded
app.use(express.urlencoded({ extended: true }));

/**
 * ROOT HEALTH CHECK (IMPORTANT)
 */
app.get("/", (req, res) => {
  return res.status(200).send("SAE-V2 Server Running");
});

/**
 * DETAILED HEALTH CHECK
 */
app.get("/health", (req, res) => {
  return res.status(200).json({
    status: "OK",
    service: "SAE-V2",
    timestamp: new Date().toISOString(),
  });
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
 * START SERVER
 */
const PORT = env.app.port || 3000;

app.listen(PORT, () => {
  console.log("=================================");
  console.log("🚀 SAE-V2 SERVER STARTED");
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 Mode: ${env.app.nodeEnv}`);
  console.log("=================================");
});
