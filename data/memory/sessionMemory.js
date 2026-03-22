/**
 * SOCCOS-AutoBot
 * Session Memory (FINAL - FIXED)
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
  updateSession,
  clearSession,
};
