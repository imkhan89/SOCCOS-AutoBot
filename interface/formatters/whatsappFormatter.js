/**
 * SOCCOS-AutoBot
 * WhatsApp Formatter
 * -------------------
 * Responsible ONLY for formatting messages
 * No business logic allowed
 */

/**
 * Format simple text message
 */
function formatTextMessage(to, message) {
    return {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: {
            body: message
        }
    };
}

/**
 * Format button message
 */
function formatButtonMessage(to, bodyText, buttons = []) {
    return {
        messaging_product: "whatsapp",
        to: to,
        type: "interactive",
        interactive: {
            type: "button",
            body: {
                text: bodyText
            },
            action: {
                buttons: buttons.map((btn, index) => ({
                    type: "reply",
                    reply: {
                        id: btn.id || `btn_${index}`,
                        title: btn.title
                    }
                }))
            }
        }
    };
}

/**
 * Format list message
 */
function formatListMessage(to, bodyText, sections = []) {
    return {
        messaging_product: "whatsapp",
        to: to,
        type: "interactive",
        interactive: {
            type: "list",
            body: {
                text: bodyText
            },
            action: {
                button: "View Options",
                sections: sections
            }
        }
    };
}

module.exports = {
    formatTextMessage,
    formatButtonMessage,
    formatListMessage
};
