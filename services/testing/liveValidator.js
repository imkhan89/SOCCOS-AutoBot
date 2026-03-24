/**
 * SAE-V2 LIVE VALIDATOR
 * --------------------------------
 * Verifies live system after deployment
 * Checks:
 * - Server health
 * - Webhook response
 */

const axios = require("axios");

const BASE_URL = "https://YOUR-DOMAIN.com"; // 🔴 UPDATE THIS

/**
 * CHECK SERVER HEALTH
 */
async function checkHealth() {
  try {
    const res = await axios.get(`${BASE_URL}/health`);
    console.log("✅ Health Check:", res.data);
  } catch (error) {
    console.error("❌ Health Check Failed:", error.message);
  }
}

/**
 * CHECK STATUS ENDPOINT
 */
async function checkStatus() {
  try {
    const res = await axios.get(`${BASE_URL}/status`);
    console.log("📊 Status:", res.data);
  } catch (error) {
    console.error("❌ Status Check Failed:", error.message);
  }
}

/**
 * RUN VALIDATION
 */
async function runValidation() {
  console.log("🚀 Running Live Validation...\n");

  await checkHealth();
  await checkStatus();

  console.log("\n✅ Validation Completed");
}

module.exports = {
  runValidation,
};
