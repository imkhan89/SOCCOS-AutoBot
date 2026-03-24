/**
 * SAE-V2 ERROR LOGGER
 * --------------------------------
 * Central error tracking
 */

const errors = [];

function logError(context, error) {
  try {
    const entry = {
      context,
      message: error?.message || "Unknown error",
      stack: error?.stack || "",
      timestamp: new Date().toISOString(),
    };

    errors.push(entry);

    console.error("🚨 Error Log:", entry);

  } catch (err) {
    console.error("❌ Error Logger Failed:", err.message);
  }
}

function getErrors() {
  return errors;
}

module.exports = {
  logError,
  getErrors,
};
