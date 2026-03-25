/**
 * Central Database Connection Layer
 * Supports MongoDB (recommended) using Mongoose
 */

const mongoose = require("mongoose");

let isConnected = false;

/**
 * Connect to MongoDB
 */
async function connectDB() {
  if (isConnected) {
    console.log("⚡ Using existing DB connection");
    return;
  }

  try {
    const MONGO_URI = process.env.MONGO_URI;

    if (!MONGO_URI) {
      throw new Error("❌ MONGO_URI not found in environment variables");
    }

    const connection = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = connection.connections[0].readyState === 1;

    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ DB Connection Error:", error.message);
    process.exit(1);
  }
}

/**
 * Disconnect DB (optional for shutdown handling)
 */
async function disconnectDB() {
  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log("🔌 MongoDB Disconnected");
  } catch (error) {
    console.error("❌ Error disconnecting DB:", error.message);
  }
}

module.exports = {
  connectDB,
  disconnectDB,
};
