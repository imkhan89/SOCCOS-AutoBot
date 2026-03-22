/**
 * SOCCOS-AutoBot
 * WhatsApp Service
 * -----------------
 * Bridge between system and WhatsApp interface
 * Combines formatter + sender
 */

const formatter = require('../interface/formatters/whatsappFormatter');
const sender = require('../interface/sender/whatsappSender');

/**
 * Send simple text message
 */
async function sendText(to, message) {
    try {
        const payload = formatter.formatTextMessage(to, message);
        return await sender.sendMessage(payload);
    } catch (error) {
        console.error('❌ sendText Error:', error.message);
        throw error;
    }
}

/**
 * Send button message
 */
async function sendButtons(to, bodyText, buttons) {
    try {
        const payload = formatter.formatButtonMessage(to, bodyText, buttons);
        return await sender.sendMessage(payload);
    } catch (error) {
        console.error('❌ sendButtons Error:', error.message);
        throw error;
    }
}

/**
 * Send list message
 */
async function sendList(to, bodyText, sections) {
    try {
        const payload = formatter.formatListMessage(to, bodyText, sections);
        return await sender.sendMessage(payload);
    } catch (error) {
        console.error('❌ sendList Error:', error.message);
        throw error;
    }
}

module.exports = {
    sendText,
    sendButtons,
    sendList
};
