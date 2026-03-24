/**
 * SAE-V2 WHATSAPP FORMATTER (FINAL - PRODUCTION SAFE)
 * Pure UI Layer — NO business logic
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
      body: (message || "").toString(),
    },
  };
}

/**
 * BUTTON MESSAGE (MAX 3)
 */
function formatButtonMessage(to, bodyText, buttons = []) {
  const safeButtons = (buttons || []).slice(0, 3).map((b, i) => ({
    type: "reply",
    reply: {
      id: b.id || `btn_${i + 1}`,
      title: (b.title || b || "Option").toString().substring(0, 20),
    },
  }));

  return {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: (bodyText || "").toString(),
      },
      action: {
        buttons: safeButtons,
      },
    },
  };
}

/**
 * LIST MESSAGE (MAX 10 ROWS PER SECTION)
 */
function formatListMessage(to, bodyText, sections = []) {
  const safeSections = (sections || []).map((section, i) => ({
    title: (section.title || "Options").substring(0, 24),
    rows: (section.rows || []).slice(0, 10).map((row, j) => ({
      id: row.id || `row_${i}_${j}`,
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
        text: (bodyText || "").toString(),
      },
      action: {
        button: "View Options",
        sections: safeSections,
      },
    },
  };
}

/**
 * IMAGE MESSAGE
 */
function formatImageMessage(to, imageUrl, caption = "") {
  return {
    messaging_product: "whatsapp",
    to,
    type: "image",
    image: {
      link: imageUrl,
      caption: (caption || "").toString(),
    },
  };
}

module.exports = {
  formatTextMessage,
  formatButtonMessage,
  formatListMessage,
  formatImageMessage,
};
