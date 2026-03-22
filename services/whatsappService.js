/**
 * SOCCOS-AutoBot
 * WhatsApp Service (Supports Buttons & Lists)
 */

const formatter = require('../interface/formatters/whatsappFormatter');
const sender = require('../interface/sender/whatsappSender');

/**
 * Send text
 */
async function sendText(to, message) {
    const payload = formatter.formatTextMessage(to, message);
    return sender.sendMessage(payload);
}

/**
 * Send buttons
 */
async function sendButtons(to, bodyText, buttons) {
    const payload = formatter.formatButtonMessage(to, bodyText, buttons);
    return sender.sendMessage(payload);
}

/**
 * Send list
 */
async function sendList(to, bodyText, sections) {
    const payload = formatter.formatListMessage(to, bodyText, sections);
    return sender.sendMessage(payload);
}

module.exports = {
    sendText,
    sendButtons,
    sendList
};
