/**
 * SOCCOS-AutoBot
 * Logger Utility — FINAL (PRODUCTION SAFE + SILENT CONTROL)
 */

const ENABLE_LOGS = false; // 🔒 disable logs in production

function safeStringify(data) {
  try {
    return JSON.stringify(data);
  } catch (e) {
    return "";
  }
}

function format(type, message, data) {
  const timestamp = new Date().toISOString();

  if (data && typeof data === "object" && Object.keys(data).length > 0) {
    return `[${timestamp}] [${type}] ${message} ${safeStringify(data)}`;
  }

  return `[${timestamp}] [${type}] ${message}`;
}

// ✅ INFO
function info(message, data = {}) {
  if (!ENABLE_LOGS) return;
  console.log(format("INFO", message, data));
}

// ✅ WARN
function warn(message, data = {}) {
  if (!ENABLE_LOGS) return;
  console.warn(format("WARN", message, data));
}

// ✅ ERROR (allowed for critical visibility)
function error(message, data = {}) {
  if (!ENABLE_LOGS) return;
  console.error(format("ERROR", message, data));
}

// ✅ BACKWARD COMPATIBILITY
function log(type, message, data = {}) {
  if (!ENABLE_LOGS) return;
  console.log(format(type || "LOG", message, data));
}

module.exports = {
  info,
  warn,
  error,
  log
};
