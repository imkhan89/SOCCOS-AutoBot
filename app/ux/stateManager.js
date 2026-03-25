/**
 * STATE MANAGER — PRODUCTION (UPDATED)
 * ------------------------------------
 * - Ensures state persistence on first access
 * - Adds session expiry (auto reset)
 * - Safe and scalable
 */

const store = new Map();

// ⏱ SESSION TTL (30 minutes)
const SESSION_TTL = 30 * 60 * 1000;

/**
 * Get full user state
 */
function getState(userId) {
  if (!userId) return buildDefaultState();

  let state = store.get(userId);

  // ✅ Create if not exists
  if (!state) {
    state = buildDefaultState();
    store.set(userId, state);
    return state;
  }

  // 🔁 Expire old sessions
  if (Date.now() - state.updatedAt > SESSION_TTL) {
    const fresh = buildDefaultState();
    store.set(userId, fresh);
    return fresh;
  }

  return state;
}

/**
 * Set full state (overwrite)
 */
function setState(userId, newState = {}) {
  if (!userId) return;

  const state = {
    ...buildDefaultState(),
    ...newState,
    updatedAt: Date.now()
  };

  store.set(userId, state);

  return state;
}

/**
 * Update partial state
 */
function updateState(userId, patch = {}) {
  if (!userId) return;

  const current = getState(userId);

  const updated = {
    ...current,
    ...patch,
    updatedAt: Date.now()
  };

  store.set(userId, updated);

  return updated;
}

/**
 * Reset user state
 */
function resetState(userId) {
  if (!userId) return;

  const fresh = buildDefaultState();

  store.set(userId, fresh);

  return fresh;
}

/**
 * Default state structure
 */
function buildDefaultState() {
  return {
    screen: "main_menu",

    lastIntent: null,

    // Product context
    productId: null,
    lastQuery: null,

    // Flow tracking
    step: null,

    // Metadata
    updatedAt: Date.now()
  };
}

/**
 * Convenience helpers
 */

function setScreen(userId, screen) {
  return updateState(userId, { screen });
}

function setProduct(userId, productId) {
  return updateState(userId, { productId });
}

function setQuery(userId, query) {
  return updateState(userId, { lastQuery: query });
}

module.exports = {
  getState,
  setState,
  updateState,
  resetState,
  setScreen,
  setProduct,
  setQuery
};
