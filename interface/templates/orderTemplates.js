/**
 * SAE-V2 ORDER TEMPLATES
 * --------------------------------
 * Pure UI Templates — NO business logic
 * Returns structured text/messages only
 */

/**
 * PRODUCT PREVIEW
 */
function productPreviewTemplate(product) {
  const title = product?.title || "Product";
  const price = product?.variants?.[0]?.price || "";

  return {
    type: "text",
    message:
      `🛒 ${title}\n` +
      `💰 Rs ${price}\n\n` +
      `Reply 0 to continue`,
  };
}

/**
 * ASK NAME
 */
function askNameTemplate() {
  return {
    type: "text",
    message: "Enter your name:",
  };
}

/**
 * ASK ADDRESS
 */
function askAddressTemplate() {
  return {
    type: "text",
    message: "Enter your address:",
  };
}

/**
 * CONFIRM ORDER
 */
function confirmOrderTemplate(order = {}) {
  const name = order.name || "";
  const address = order.address || "";
  const title = order.product?.title || "";

  return {
    type: "text",
    message:
      `🧾 Order Summary\n\n` +
      `Product: ${title}\n` +
      `Name: ${name}\n` +
      `Address: ${address}\n\n` +
      `Confirm order?\n1 Yes\n2 No`,
  };
}

/**
 * ORDER SUCCESS
 */
function orderSuccessTemplate(orderId) {
  return {
    type: "text",
    message: `✅ Order Confirmed\nID: ${orderId}`,
  };
}

/**
 * ORDER CANCELLED
 */
function orderCancelledTemplate() {
  return {
    type: "text",
    message: "❌ Order cancelled",
  };
}

module.exports = {
  productPreviewTemplate,
  askNameTemplate,
  askAddressTemplate,
  confirmOrderTemplate,
  orderSuccessTemplate,
  orderCancelledTemplate,
};
