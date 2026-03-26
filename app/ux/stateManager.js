/**
 * STATE MANAGER — UPDATED (MEMORY SAFE + SCALABLE)
 */

const store = new Map();

// ⏱ CONFIG
const SESSION_TTL = 30 * 60 * 1000; // 30 min
const MAX_USERS = 10000;

/**
 * 🧹 GLOBAL MEMORY CONTROL
 */
function enforceLimit() {
  if (store.size > MAX_USERS) {
    const excess = store.size - MAX_USERS;
    const keys = store.keys();

    for (let i = 0; i < excess; i++) {
      store.delete(keys.next().value);
    }
  }
}

/**
 * DEFAULT STATE
 */
function buildDefaultState() {
  return {
    screen: "main_menu",
    lastIntent: null,
    productId: null,
    lastQuery: null,
    step: null,
    updatedAt: Date.now()
  };
}

/**
 * GET STATE
 */
function getState(userId) {
  if (!userId) return buildDefaultState();

  let state = store.get(userId);

  if (!state) {
    enforceLimit();
    state = buildDefaultState();
    store.set(userId, state);
    return state;
  }

  // TTL expiry
  if (Date.now() - state.updatedAt > SESSION_TTL) {
    const fresh = buildDefaultState();
    store.set(userId, fresh);
    return fresh;
  }

  return state;
}

/**
 * SET STATE (FULL REPLACE)
 */
function setState(userId, newState = {}) {
  if (!userId) return;

  enforceLimit();

  const state = {
    ...buildDefaultState(),
    ...newState,
    updatedAt: Date.now()
  };

  store.set(userId, state);
  return state;
}

/**
 * UPDATE STATE (PARTIAL)
 */
function updateState(userId, patch = {}) {
  if (!userId || typeof patch !== "object") return;

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
 * RESET STATE
 */
function resetState(userId) {
  if (!userId) return;

  const fresh = buildDefaultState();
  store.set(userId, fresh);

  return fresh;
}

/**
 * HELPERS
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
