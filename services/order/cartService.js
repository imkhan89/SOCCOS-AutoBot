/**
 * CART SERVICE — UPDATED (MEMORY SAFE + CONTROLLED)
 */

const logger = require("../../utils/logger");
const { getFinalPrice } = require("../product/pricingService");
const { validateQuantity } = require("../product/stockService");

// 🧠 In-memory store
const carts = new Map();

// Limits
const MAX_CART_ITEMS = 50;
const MAX_USERS = 5000;

/**
 * 🧹 GLOBAL MEMORY GUARD (prevents uncontrolled growth)
 */
function enforceGlobalLimit() {
  if (carts.size > MAX_USERS) {
    const excess = carts.size - MAX_USERS;

    const keys = carts.keys();
    for (let i = 0; i < excess; i++) {
      const key = keys.next().value;
      carts.delete(key);
    }
  }
}

/**
 * 🆔 GET USER CART
 */
function getCart(userId) {
  if (!userId) return null;

  if (!carts.has(userId)) {
    enforceGlobalLimit();
    carts.set(userId, []);
  }

  return carts.get(userId);
}

/**
 * ➕ ADD ITEM TO CART
 */
function addToCart(userId, product, quantity = 1) {
  try {
    if (!userId || !product) return null;

    const cart = getCart(userId);

    // ✅ Validate quantity
    const validation = validateQuantity(product, quantity);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.message,
      };
    }

    const productId = product.id || product._id;

    const existing = cart.find((item) => item.productId === productId);

    if (existing) {
      existing.quantity += quantity;
    } else {
      // 🚫 Prevent cart overflow
      if (cart.length >= MAX_CART_ITEMS) {
        return {
          success: false,
          message: "Cart limit reached",
        };
      }

      cart.push({
        productId,
        name: product.title || product.name,
        price: getFinalPrice(product),
        quantity,
      });
    }

    return {
      success: true,
      cart,
    };

  } catch (error) {
    logger.error("AddToCartError", error);
    return {
      success: false,
      message: "Unable to add to cart",
    };
  }
}

/**
 * ➖ REMOVE ITEM FROM CART
 */
function removeFromCart(userId, productId) {
  try {
    if (!userId || !productId) return { success: false };

    const cart = getCart(userId);

    const updatedCart = cart.filter(
      (item) => item.productId !== productId
    );

    carts.set(userId, updatedCart);

    return {
      success: true,
      cart: updatedCart,
    };

  } catch (error) {
    logger.error("RemoveFromCartError", error);
    return { success: false };
  }
}

/**
 * 🧾 GET CART TOTAL
 */
function getCartTotal(userId) {
  try {
    const cart = getCart(userId);

    return cart.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

  } catch (error) {
    logger.error("CartTotalError", error);
    return 0;
  }
}

/**
 * 🧹 CLEAR CART
 */
function clearCart(userId) {
  try {
    if (!userId) return false;

    carts.delete(userId); // better than empty array
    return true;

  } catch (error) {
    logger.error("ClearCartError", error);
    return false;
  }
}

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  getCartTotal,
  clearCart,
};
