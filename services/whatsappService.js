/**
 * SOCCOS-AutoBot
 * WhatsApp Service (FINAL - CLEAN & SAFE)
 * ---------------------------------------
 * ONLY:
 * - Calls formatter
 * - Calls sender
 * NO business logic
 */

const formatter = require("../interface/formatters/whatsappFormatter");
const sender = require("../interface/sender/whatsappSender");

/**
 * SEND TEXT MESSAGE
 */
async function sendText(to, message) {
  try {
    if (!to || !message) return;

    const payload = formatter.formatTextMessage(to, message);

    await sender.send(payload);

  } catch (error) {
    console.error("❌ WhatsApp sendText error:", error.message);
  }
}

/**
 * SEND BUTTON MESSAGE
 */
async function sendButtons(to, bodyText, buttons = []) {
  try {
    if (!to || !bodyText) return;

    const payload = formatter.formatButtonMessage(
      to,
      bodyText,
      buttons
    );

    await sender.send(payload);

  } catch (error) {
    console.error("❌ WhatsApp sendButtons error:", error.message);
  }
}

/**
 * SEND LIST MESSAGE
 */
async function sendList(to, bodyText, sections = []) {
  try {
    if (!to || !bodyText) return;

    const payload = formatter.formatListMessage(
      to,
      bodyText,
      sections
    );

    await sender.send(payload);

  } catch (error) {
    console.error("❌ WhatsApp sendList error:", error.message);
  }
}

module.exports = {
  sendText,
  sendButtons,
  sendList,
};
