/**
 * PIPELINE — FINAL (TRACKING ENABLED + FUNNEL OPTIMIZED + PURCHASE FLOW)
 */

const sessionMemory = require("../../data/memory/sessionMemory");

// UX (EXISTING ARCHITECTURE SAFE)
const { resolveIntent } = require("../ux/intentResolver");
const { buildFlow } = require("../ux/flowBuilder");

// Sender
const { sendMessage } = require("../../interface/sender/whatsappSender");

// ✅ TRACKING
const { trackEvent } = require("../../services/analytics/eventTracker");

// ✅ PRODUCT + CART UI
const { getProduct } = require("../../services/product/getProduct");
const productView = require("../../interface/ui/product/productView");
const addToCart = require("../../interface/ui/cart/addToCart");

/**
 * NORMALIZE MESSAGE
 */
function normalizeMessage(text = "") {
  if (!text || typeof text !== "string") return "";

  return text
    .toLowerCase()
    .replace(/🔍/g, "")
    .replace(/search product/gi, "")
    .replace(/browse categories/gi, "")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * STRICT RESPONSE VALIDATION
 */
function isValidResponse(res) {
  if (!res || typeof res !== "object") return false;
  if (!res.type) return false;
  if (!res.message) return false;

  if (res.type === "interactive" && (!res.buttons || res.buttons.length === 0)) return false;
  if (res.type === "list" && (!res.sections || res.sections.length === 0)) return false;

  if (!res.metadata || typeof res.metadata !== "object") return false;

  return true;
}

/**
 * NORMALIZE RESPONSE (STRICT CONTRACT)
 */
function normalizeResponse(response = {}) {
  return {
    type: response.type,
    message: response.message,
    ...(response.buttons && response.buttons.length ? { buttons: response.buttons } : {}),
    ...(response.sections && response.sections.length ? { sections: response.sections } : {}),
    metadata: response.metadata || {}
  };
}

/**
 * FUNNEL-OPTIMIZED FALLBACK
 */
function getFallbackResponse() {
  return {
    type: "interactive",
    message: "Quickly find your auto part. Choose an option:",
    buttons: [
      { id: "search_product", title: "Search Product" },
      { id: "browse_categories", title: "Browse Categories" },
      { id: "support", title: "Talk to Support" }
    ],
    metadata: {
      screen: "fallback",
      funnel_step: "entry",
      intent: "unknown"
    }
  };
}

/**
 * 🔍 EXTRACT ACTION IDS
 */
function extractAction(text = "") {
  if (!text) return {};

  const match = text.match(/(view|buy|ask|checkout)_(.+)/i);
  if (!match) return {};

  return {
    action: match[1],
    id: match[2]
  };
}

/**
 * MAIN PIPELINE
 */
async function messagePipeline({ from, text } = {}) {
  try {
    if (!from) return null;

    const rawMessage = text || "";
    const cleanedMessage = normalizeMessage(rawMessage);

    const session = sessionMemory.getSession(from) || {};

    /**
     * RATE LIMIT
     */
    if (
      session.lastMessageTime &&
      Date.now() - session.lastMessageTime < 300
    ) {
      return null;
    }

    /**
     * SESSION UPDATE
     */
    sessionMemory.updateSession(from, {
      lastMessageTime: Date.now(),
      lastActivity: Date.now(),
      lastUserMessage: rawMessage
    });

    /**
     * 🔥 ACTION HANDLER (HIGHEST PRIORITY)
     */
    const { action, id } = extractAction(rawMessage);

    if (action && id) {
      const product = await getProduct({ id });

      if (action === "view") {
        const response = productView({ product, source: "search" });
        const normalized = normalizeResponse(response);

        await sendMessage(from, normalized);

        trackEvent({
          user: from,
          event: "product_view",
          productId: id,
          screen: "product_view",
          funnel_step: "decision"
        });

        return normalized;
      }

      if (action === "buy") {
        const response = addToCart({ product });
        const normalized = normalizeResponse(response);

        await sendMessage(from, normalized);

        trackEvent({
          user: from,
          event: "add_to_cart",
          productId: id,
          screen: "add_to_cart",
          funnel_step: "intent"
        });

        return normalized;
      }

      if (action === "checkout") {
        const response = {
          type: "interactive",
          message:
            "🧾 Checkout\n\nConfirm your order with our team now.\nFast processing & delivery available.",
          buttons: [
            { id: "confirm_order", title: "Confirm Order" },
            { id: "continue_shopping", title: "More Products" },
            { id: "support", title: "Need Help?" }
          ],
          metadata: {
            screen: "checkout",
            productId: id,
            funnel_step: "purchase",
            intent: "high"
          }
        };

        const normalized = normalizeResponse(response);

        await sendMessage(from, normalized);

        trackEvent({
          user: from,
          event: "checkout_started",
          productId: id,
          screen: "checkout",
          funnel_step: "purchase"
        });

        return normalized;
      }
    }

    /**
     * INTENT RESOLUTION
     */
    const intent = resolveIntent(cleanedMessage);

    // ✅ TRACK USER ENTRY
    trackEvent({
      user: from,
      event: "user_message",
      screen: "unknown",
      funnel_step: "entry"
    });

    let response = null;

    /**
     * FLOW EXECUTION
     */
    try {
      response = await buildFlow(from, intent, { text: rawMessage });
    } catch (e) {
      response = null;
    }

    /**
     * FALLBACK SAFETY
     */
    if (!isValidResponse(response)) {
      response = getFallbackResponse();
    }

    /**
     * FINAL NORMALIZATION
     */
    const normalizedResponse = normalizeResponse(response);

    /**
     * GUARANTEED SEND
     */
    await sendMessage(from, normalizedResponse);

    // ✅ TRACK BOT RESPONSE
    trackEvent({
      user: from,
      event: "bot_response",
      screen: normalizedResponse?.metadata?.screen,
      funnel_step: normalizedResponse?.metadata?.funnel_step
    });

    return normalizedResponse;

  } catch (error) {
    const fallback = {
      type: "text",
      message: "Something went wrong. Please try again.",
      metadata: {
        screen: "pipeline_error",
        funnel_step: "error"
      }
    };

    await sendMessage(from, fallback);

    return fallback;
  }
}

module.exports = messagePipeline;
