/**
 * SOCCOS-AutoBot
 * Logger Utility
 */

function log(type, message, data = {}) {
    console.log(`[${type}] ${message}`, data);
}

module.exports = {
    log
};
