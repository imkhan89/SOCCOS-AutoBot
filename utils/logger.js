/**
 * SOCCOS-AutoBot
 * Logger Utility (Production Safe)
 */

function format(type, message, data) {
  const timestamp = new Date().toISOString();

  if (data && Object.keys(data).length > 0) {
    return `[${timestamp}] [${type}] ${message} ${JSON.stringify(data)}`;
  }

  return `[${timestamp}] [${type}] ${message}`;
}

// ✅ INFO
function info(message, data = {}) {
  console.log(format("INFO", message, data));
}

// ✅ WARN
function warn(message, data = {}) {
  console.warn(format("WARN", message, data));
}

// ✅ ERROR
function error(message, data = {}) {
  console.error(format("ERROR", message, data));
}

// ✅ GENERIC (BACKWARD COMPATIBILITY)
function log(type, message, data = {}) {
  console.log(format(type, message, data));
}

module.exports = {
  info,
  warn,
  error,
  log
};
