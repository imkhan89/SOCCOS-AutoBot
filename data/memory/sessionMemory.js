/**
 * SOCCOS-AutoBot
 * Session Memory (Bulletproof)
 */

const sessions = {};

/**
 * Get session
 */
function getSession(userId) {
    if (!sessions[userId]) {
        sessions[userId] = {
            lastIntent: null,
            lastQuery: null,
            context: {},
            lastResults: [],
            order: {
                step: null,
                product: null,
                name: null,
                address: null,
                isProcessing: false
            }
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
        ...data,
        order: {
            ...session.order,
            ...(data.order || {})
        }
    };

    return sessions[userId];
}

/**
 * Clear session
 */
function clearSession(userId) {
    delete sessions[userId];
}

module.exports = {
    getSession,
    updateSession,
    clearSession
};
