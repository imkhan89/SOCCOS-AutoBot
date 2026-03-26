/**
 * SAE-V2 ERROR LOGGER (UPDATED — HARD CAP + MEMORY SAFE)
 */

const MAX_ERRORS = 1000;
const errors = [];

/**
 * 🔒 STRICT SAFE PUSH
 */
function safePush(entry) {
  if (!entry) return;

  // Enforce hard cap BEFORE push
  if (errors.length >= MAX_ERRORS) {
    errors.splice(0, errors.length - MAX_ERRORS + 1);
  }

  errors.push(entry);
}

/**
 * 🚨 ERROR LOGGER
 */
function logError(context, error) {
  try {
    const entry = {
      context: context || "UNKNOWN_CONTEXT",
      message: error?.message || "Unknown error",
      stack: error?.stack || null,
      timestamp: Date.now(),
    };

    safePush(entry);

    // Reduce console noise in production
    if (process.env.NODE_ENV !== "production") {
      console.error("ERROR:", entry);
    }

  } catch (err) {
    console.error("ErrorLoggerFailure:", err.message);
  }
}

/**
 * 📥 GET ERRORS (READ-ONLY COPY)
 */
function getErrors() {
  return [...errors];
}

module.exports = {
  logError,
  getErrors,
};
