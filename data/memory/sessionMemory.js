/**
 * SESSION MEMORY — UPDATED (HARD CAP + SAFE GC)
 */

const SESSION_TTL = 1000 * 60 * 60 * 24; // 24 hours
const MAX_SESSIONS = 10000;

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

    lastActivity: Date.now(),
    recoverySent: false,
    recoveryTimestamp: null,

    lastMessageTime: null,

    updatedAt: Date.now(),
  };
}

/**
 * 🧹 CLEAN EXPIRED + ENFORCE MAX SIZE
 */
function cleanupSessions() {
  const now = Date.now();

  const userIds = Object.keys(sessions);

  // TTL cleanup
  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    const session = sessions[userId];

    if (!session?.updatedAt) continue;

    if (now - session.updatedAt > SESSION_TTL) {
      delete sessions[userId];
    }
  }

  // Hard cap enforcement
  const keys = Object.keys(sessions);
  if (keys.length > MAX_SESSIONS) {
    const excess = keys.length - MAX_SESSIONS;

    for (let i = 0; i < excess; i++) {
      delete sessions[keys[i]]; // remove oldest (insertion order)
    }
  }
}

/**
 * GET SESSION
 */
function getSession(userId) {
  if (!userId) return createDefaultSession();

  cleanupSessions();

  if (!sessions[userId]) {
    sessions[userId] = createDefaultSession();
  }

  return sessions[userId];
}

/**
 * GET ALL SESSIONS
 */
function getAllSessions() {
  cleanupSessions();
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

    lastResults: Array.isArray(data.lastResults)
      ? data.lastResults
      : session.lastResults,

    order: {
      ...session.order,
      ...(data.order || {}),
    },

    lastActivity: Date.now(),

    recoverySent:
      typeof data.recoverySent === "boolean"
        ? data.recoverySent
        : session.recoverySent,

    recoveryTimestamp:
      typeof data.recoveryTimestamp === "number"
        ? data.recoveryTimestamp
        : session.recoveryTimestamp,

    updatedAt: Date.now(),
  };

  return sessions[userId];
}

/**
 * CLEAR SESSION
 */
function clearSession(userId) {
  if (!userId) return;

  delete sessions[userId]; // free memory instead of reset
}

/**
 * EXPORT (FOR REDIS MIGRATION)
 */
function exportSessions() {
  return { ...sessions }; // shallow copy safety
}

module.exports = {
  getSession,
  getAllSessions,
  updateSession,
  clearSession,
  exportSessions,
};
