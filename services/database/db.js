/**
 * DATABASE CONNECTION LAYER — FINAL (SAFE + PRODUCTION CLEAN)
 */

const mongoose = require("mongoose");

let isConnected = false;

/**
 * CONNECT TO MONGODB
 */
async function connectDB() {
  try {
    if (isConnected) {
      return true;
    }

    const MONGO_URI = process.env.MONGO_URI;

    if (!MONGO_URI) {
      return false;
    }

    const connection = await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    isConnected = connection?.connections?.[0]?.readyState === 1;

    return isConnected;

  } catch (error) {
    return false;
  }
}

/**
 * DISCONNECT DATABASE
 */
async function disconnectDB() {
  try {
    if (!isConnected) return;

    await mongoose.disconnect();
    isConnected = false;

  } catch (error) {
    // silent fail-safe
  }
}

module.exports = {
  connectDB,
  disconnectDB
};
