/**
 * SAE-V2 CHAT LOGGER
 * --------------------------------
 * Logs all incoming + outgoing messages
 */

const logs = [];

function logChat({ userId, message, response }) {
  try {
    const entry = {
      userId,
      message,
      response,
      timestamp: new Date().toISOString(),
    };

    logs.push(entry);

    console.log("📘 Chat Log:", entry);

  } catch (error) {
    console.error("❌ Chat Logger Error:", error.message);
  }
}

function getLogs() {
  return logs;
}

module.exports = {
  logChat,
  getLogs,
};
