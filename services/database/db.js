/**
 * DATABASE CONNECTION LAYER — UPDATED (SAFE + STABLE)
 */

const mongoose = require("mongoose");

let isConnected = false;

/**
 * CONNECT TO MONGODB
 */
async function connectDB() {
  if (isConnected) {
    if (process.env.NODE_ENV !== "production") {
      console.log("DB: Using existing connection");
    }
    return true;
  }

  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    console.error("DB: Missing MONGO_URI");
    return false; // ❗ do not crash process
  }

  try {
    const connection = await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = connection?.connections?.[0]?.readyState === 1;

    if (isConnected) {
      console.log("DB: Connected");
      return true;
    }

    return false;

  } catch (error) {
    console.error("DB Connection Error:", error.message);
    return false; // ❗ prevent process.exit crash
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

    if (process.env.NODE_ENV !== "production") {
      console.log("DB: Disconnected");
    }

  } catch (error) {
    console.error("DB Disconnect Error:", error.message);
  }
}

module.exports = {
  connectDB,
  disconnectDB,
};
