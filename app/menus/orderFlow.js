/**
 * SAE-V2 ORDER FLOW (FINAL)
 * --------------------------------
 * Handles:
 * - Product selection
 * - Step-based order flow
 * - Shopify order creation
 * Uses templates (NO hardcoded UI)
 */

const sessionMemory = require("../../data/memory/sessionMemory");
const shopifyClient = require("../../integrations/shopifyClient");

// Templates
const {
  productPreviewTemplate,
  askNameTemplate,
  askAddressTemplate,
  confirmOrderTemplate,
  orderSuccessTemplate,
  orderCancelledTemplate,
} = require("../../interface/templates/orderTemplates");

/**
 * HANDLE ORDER FLOW
 */
async function handleOrder(userId, text) {
  try {
    const session = sessionMemory.getSession(userId);
    const order = session.order;

    /**
     * NO ORDER → CHECK IF SELECTION
     */
    if (!order || !order.step) {
      const results = session.lastResults || [];
      const index = parseInt(text) - 1;

      const product = results[index];

      if (!product) return null;

      sessionMemory.updateSession(userId, {
        order: {
          step: "awaiting_continue",
          product,
        },
      });

      return productPreviewTemplate(product);
    }

    /**
     * STEP 0 → CONTINUE
     */
    if (order.step === "awaiting_continue") {
      if (text === "0") {
        sessionMemory.updateSession(userId, {
          order: { ...order, step: "awaiting_name" },
        });

        return askNameTemplate();
      }

      return {
        type: "text",
        message: "Reply 0 to continue",
      };
    }

    /**
     * STEP 1 → NAME
     */
    if (order.step === "awaiting_name") {
      sessionMemory.updateSession(userId, {
        order: {
          ...order,
          step: "awaiting_address",
          name: text,
        },
      });

      return askAddressTemplate();
    }

    /**
     * STEP 2 → ADDRESS
     */
    if (order.step === "awaiting_address") {
      sessionMemory.updateSession(userId, {
        order: {
          ...order,
          step: "confirm_order",
          address: text,
        },
      });

      return confirmOrderTemplate({
        ...order,
        address: text,
      });
    }

    /**
     * STEP 3 → CONFIRM
     */
    if (order.step === "confirm_order") {
      if (text === "1") {
        const res = await shopifyClient.createOrder({
          product: order.product,
          name: order.name,
          address: order.address,
        });

        sessionMemory.updateSession(userId, {
          order: null,
          currentMenu: "main",
        });

        return orderSuccessTemplate(res?.id || "N/A");
      }

      if (text === "2") {
        sessionMemory.updateSession(userId, {
          order: null,
          currentMenu: "main",
        });

        return orderCancelledTemplate();
      }

      return {
        type: "text",
        message: "Reply 1 to confirm or 2 to cancel",
      };
    }

    return null;

  } catch (error) {
    console.error("❌ Order Flow Error:", error.message);
    return {
      type: "text",
      message: "Order processing error",
    };
  }
}

module.exports = {
  handleOrder,
};
