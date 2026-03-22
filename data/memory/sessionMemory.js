/**
 * SOCCOS-AutoBot
 * Session Memory
 * ----------------
 * In-memory session storage (per user)
 */

const sessions = {};

/**
 * Get session by phone number
 */
function getSession(userId) {
    if (!sessions[userId]) {
        sessions[userId] = {
            lastIntent: null,
            lastQuery: null,
            context: {}
        };
    }

    return sessions[userId];
}

/**
 * Update session
 */
function updateSession(userId, data = {}) {
    const session = getSession(userId);

    sessions[userId] = {
        ...session,
        ...data
    };

    return sessions[userId];
}

/**
 * Clear session
 */
function clearSession(userId) {
    delete sessions[userId];
}

/**
 * Get all sessions (for debugging)
 */
function getAllSessions() {
    return sessions;
}

module.exports = {
    getSession,
    updateSession,
    clearSession,
    getAllSessions
};
