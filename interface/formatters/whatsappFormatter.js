/**
 * SAE-V2 WHATSAPP FORMATTER (FINAL - PRODUCTION SAFE + UX LAYER)
 * --------------------------------
 * LOW LEVEL = Meta payload formatting
 * HIGH LEVEL = UX formatting (text structure)
 */

/**
 * =========================
 * LOW LEVEL (EXISTING)
 * =========================
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

/**
 * =========================
 * HIGH LEVEL (NEW UX LAYER)
 * =========================
 */

function cleanText(text) {
  return (text || "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * MENU FORMAT
 */
function formatMenuText(title, options = []) {
  let msg = `📋 *${title}*\n\n`;

  options.forEach((opt, i) => {
    msg += `${i + 1}. ${opt}\n`;
  });

  msg += `\n_Reply with number_`;

  return cleanText(msg);
}

/**
 * PRODUCT LIST FORMAT
 */
function formatProductText(products = []) {
  if (!products.length) return "❌ No products found";

  let msg = "🔎 *Available Products:*\n\n";

  products.forEach((p, i) => {
    const price = p.price || p.variants?.[0]?.price || "";
    msg += `${i + 1}. *${p.title}*\n💰 Rs ${price}\n\n`;
  });

  msg += "_Reply with product number_";

  return cleanText(msg);
}

/**
 * ORDER SUMMARY FORMAT
 */
function formatOrderText(product, price) {
  return cleanText(
    `🛒 *Order Summary*\n\n` +
    `📦 ${product}\n` +
    `💰 Rs ${price}\n\n` +
    `_Reply 0 to continue_`
  );
}

/**
 * SIMPLE TEXT FORMAT
 */
function formatSimpleText(text) {
  return cleanText(text);
}

/**
 * =========================
 * EXPORTS
 * =========================
 */

module.exports = {
  // LOW LEVEL (Meta API)
  formatTextMessage,
  formatButtonMessage,
  formatListMessage,
  formatImageMessage,

  // HIGH LEVEL (UX)
  formatMenuText,
  formatProductText,
  formatOrderText,
  formatSimpleText,
};
