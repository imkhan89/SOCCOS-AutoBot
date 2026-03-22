/**
 * SOCCOS-AutoBot
 * WhatsApp Formatter (FINAL - SAFE)
 * --------------------------------
 * ONLY formatting
 * NO business logic
 */

/**
 * TEXT MESSAGE
 */
function formatTextMessage(to, message) {
  return {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: {
      body: message || "",
    },
  };
}

/**
 * BUTTON MESSAGE
 * Max 3 buttons (WhatsApp limit)
 */
function formatButtonMessage(to, bodyText, buttons = []) {
  const safeButtons = (buttons || []).slice(0, 3).map((btn, index) => ({
    type: "reply",
    reply: {
      id: btn.id || `btn_${index}`,
      title: (btn.title || "Option").substring(0, 20),
    },
  }));

  return {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: bodyText || "",
      },
      action: {
        buttons: safeButtons,
      },
    },
  };
}

/**
 * LIST MESSAGE
 * Max 10 rows per section (WhatsApp limit)
 */
function formatListMessage(to, bodyText, sections = []) {
  const safeSections = (sections || []).map((section) => ({
    title: section.title || "Options",
    rows: (section.rows || []).slice(0, 10).map((row, index) => ({
      id: row.id || `row_${index}`,
      title: (row.title || "Item").substring(0, 24),
      description: (row.description || "").substring(0, 72),
    })),
  }));

  return {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: {
        text: bodyText || "",
      },
      action: {
        button: "View Options",
        sections: safeSections,
      },
    },
  };
}

/**
 * OPTIONAL: HEADER SUPPORT (for future scaling)
 */
function formatTextWithHeader(to, headerText, bodyText) {
  return {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      header: {
        type: "text",
        text: headerText || "",
      },
      body: {
        text: bodyText || "",
      },
      action: {
        buttons: [],
      },
    },
  };
}

module.exports = {
  formatTextMessage,
  formatButtonMessage,
  formatListMessage,
  formatTextWithHeader,
};
