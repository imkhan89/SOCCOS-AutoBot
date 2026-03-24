/**
 * SOCCOS-AutoBot
 * Session Memory (FINAL — HARDENED + SCALE READY)
 */

const SESSION_TTL = 1000 * 60 * 60 * 24; // 24 hours
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

    mode: null,

    order: {
      step: null,
      product: null,
      name: null,
      address: null,
      isProcessing: false,
    },

    // ✅ Recovery System
    lastActivity: Date.now(),
    recoverySent: false,

    // ✅ Anti-spam
    lastMessageTime: null,

    updatedAt: Date.now(),
  };
}

/**
 * 🧹 CLEAN EXPIRED SESSIONS (AUTO GC)
 */
function cleanupSessions() {
  const now = Date.now();

  for (const userId in sessions) {
    const session = sessions[userId];

    if (!session?.updatedAt) continue;

    if (now - session.updatedAt > SESSION_TTL) {
      delete sessions[userId];
    }
  }
}

/**
 * GET SESSION
 */
function getSession(userId) {
  if (!userId) return createDefaultSession();

  cleanupSessions(); // ✅ auto cleanup

  if (!sessions[userId]) {
    sessions[userId] = createDefaultSession();
  }

  return sessions[userId];
}

/**
 * GET ALL SESSIONS (for recovery engine)
 */
function getAllSessions() {
  cleanupSessions(); // ✅ keep memory clean
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

    // ✅ ALWAYS refresh activity (critical for recovery)
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

/**
 * ❗ OPTIONAL (FUTURE REDIS MIGRATION READY)
 */
function exportSessions() {
  return sessions;
}

module.exports = {
  getSession,
  getAllSessions,
  updateSession,
  clearSession,
  exportSessions, // ready for Redis migration
};
