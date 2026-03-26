/**
 * PIPELINE — FINAL (SEARCH FIX + FORCE RESPONSE + FULL FUNNEL)
 */

const sessionMemory = require("../../data/memory/sessionMemory");

// UX
const { resolveIntent } = require("../ux/intentResolver");
const { buildFlow } = require("../ux/flowBuilder");

// Sender
const { sendMessage } = require("../../interface/sender/whatsappSender");

// Tracking
const { trackEvent } = require("../../services/analytics/eventTracker");

// Product + UI
const { getProduct } = require("../../services/product/getProduct");
const productView = require("../../interface/ui/product/productView");
const addToCart = require("../../interface/ui/cart/addToCart");

// 🔥 SEARCH SERVICE + UI (NEW)
const { searchProducts } = require("../../services/search/productSearch");
const searchResultsUI = require("../../interface/ui/search/searchResults");

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
 * NORMALIZE RESPONSE
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
 * FALLBACK
 */
function getFallbackResponse() {
  return {
    type: "interactive",
    message: "Welcome! What are you looking for today?",
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
 * EXTRACT ACTION
 */
function extractAction(text = "") {
  if (!text) return {};

  const match = text.match(/(view|buy|checkout)_(.+)/i);
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
     * REMOVE HARD BLOCK
     */
    if (
      session.lastMessageTime &&
      Date.now() - session.lastMessageTime < 100
    ) {
      // allow flow
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
     * ACTION HANDLER
     */
    const { action, id } = extractAction(rawMessage);

    if (action && id) {
      const product = await getProduct({ id });

      let response = null;

      if (action === "view") {
        response = productView({ product, source: "search" });

        trackEvent({
          user: from,
          event: "product_view",
          productId: id,
          screen: "product_view",
          funnel_step: "decision"
        });
      }

      if (action === "buy") {
        response = addToCart({ product });

        trackEvent({
          user: from,
          event: "add_to_cart",
          productId: id,
          screen: "add_to_cart",
          funnel_step: "intent"
        });
      }

      if (action === "checkout") {
        response = {
          type: "interactive",
          message: "Confirm your order with our team now.",
          buttons: [
            { id: "confirm_order", title: "Confirm Order" },
            { id: "support", title: "Need Help?" }
          ],
          metadata: {
            screen: "checkout",
            productId: id,
            funnel_step: "purchase",
            intent: "high"
          }
        };

        trackEvent({
          user: from,
          event: "checkout_started",
          productId: id,
          screen: "checkout",
          funnel_step: "purchase"
        });
      }

      if (!isValidResponse(response)) {
        response = getFallbackResponse();
      }

      const normalized = normalizeResponse(response);
      await sendMessage(from, normalized);
      return normalized;
    }

    /**
     * INTENT FLOW
     */
    let response = null;

    try {
      const intent = resolveIntent(cleanedMessage);
      response = await buildFlow(from, intent, { text: rawMessage });
    } catch (e) {
      response = null;
    }

    /**
     * 🔥 SEARCH DIRECT FALLBACK (CRITICAL FIX)
     */
    if (!isValidResponse(response) && cleanedMessage) {
      try {
        const results = await searchProducts(cleanedMessage);

        response = searchResultsUI({
          query: cleanedMessage,
          results: Array.isArray(results) ? results : []
        });
      } catch (e) {
        response = null;
      }
    }

    /**
     * FINAL FALLBACK
     */
    if (!isValidResponse(response)) {
      response = getFallbackResponse();
    }

    const normalizedResponse = normalizeResponse(response);

    await sendMessage(from, normalizedResponse);

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
      message: "Please try again.",
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
