/**
 * SOCCOS-AutoBot
 * Session Memory (FINAL — STEP 10 READY)
 */

const sessions = {};

/**
 * DEFAULT SESSION STRUCTURE
 */
function createDefaultSession() {
  return {
    lastIntent: null,
    lastQuery: null,
    context: {},
    lastResults: [],

    order: {
      step: null,
      product: null,
      name: null,
      address: null,
      isProcessing: false,
    },

    // ✅ NEW (Recovery System)
    lastActivity: Date.now(),
    recoverySent: false,

    updatedAt: Date.now(),
  };
}

/**
 * GET SESSION
 */
function getSession(userId) {
  if (!userId) return createDefaultSession();

  if (!sessions[userId]) {
    sessions[userId] = createDefaultSession();
  }

  return sessions[userId];
}

/**
 * GET ALL SESSIONS (for recovery engine)
 */
function getAllSessions() {
  return sessions;
}

/**
 * UPDATE SESSION
 */
function updateSession(userId, data = {}) {
  if (!userId || typeof data !== "object") return null;

  const session = getSession(userId);

  sessions[userId] = {
    ...session,
    ...data,

    context: {
      ...session.context,
      ...(data.context || {}),
    },

    lastResults: data.lastResults || session.lastResults,

    order: {
      ...session.order,
      ...(data.order || {}),
    },

    // ✅ CRITICAL: update activity timestamp
    lastActivity: Date.now(),

    // preserve recovery flag unless explicitly changed
    recoverySent:
      typeof data.recoverySent === "boolean"
        ? data.recoverySent
        : session.recoverySent,

    updatedAt: Date.now(),
  };

  return sessions[userId];
}

/**
 * CLEAR SESSION (SAFE RESET)
 */
function clearSession(userId) {
  if (!userId) return;

  sessions[userId] = createDefaultSession();
}

module.exports = {
  getSession,
  getAllSessions, // ✅ NEW
  updateSession,
  clearSession,
};
