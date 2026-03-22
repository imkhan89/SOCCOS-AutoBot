/**
 * SOCCOS-AutoBot
 * WhatsApp Service (FINAL - FIXED)
 */

const formatter = require("../interface/formatters/whatsappFormatter");
const sender = require("../interface/sender/whatsappSender");

/**
 * SEND TEXT MESSAGE
 */
async function sendText(to, message) {
  try {
    if (!to || !message) return null;

    const payload = formatter.formatTextMessage(to, message);
    if (!payload) return null;

    return await sender.send(payload);

  } catch (error) {
    console.error("❌ WhatsApp sendText error:", error.message);
    return null;
  }
}

/**
 * SEND BUTTON MESSAGE
 */
async function sendButtons(to, bodyText, buttons = []) {
  try {
    if (!to || !bodyText) return null;

    const payload = formatter.formatButtonMessage(
      to,
      bodyText,
      buttons
    );

    if (!payload) return null;

    return await sender.send(payload);

  } catch (error) {
    console.error("❌ WhatsApp sendButtons error:", error.message);
    return null;
  }
}

/**
 * SEND LIST MESSAGE
 */
async function sendList(to, bodyText, sections = []) {
  try {
    if (!to || !bodyText) return null;

    const payload = formatter.formatListMessage(
      to,
      bodyText,
      sections
    );

    if (!payload) return null;

    return await sender.send(payload);

  } catch (error) {
    console.error("❌ WhatsApp sendList error:", error.message);
    return null;
  }
}

module.exports = {
  sendText,
  sendButtons,
  sendList,
};
