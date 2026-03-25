/**
 * CART SERVICE — CLEAN (LOGIC ONLY)
 * ---------------------------------
 * - No UI
 * - In-memory cart (per session/user)
 * - Ready to replace with DB later
 */

const logger = require("../../utils/logger");
const { getFinalPrice } = require("../product/pricingService");
const { validateQuantity } = require("../product/stockService");

// 🧠 In-memory store (replace with Redis/DB later)
const carts = new Map();

/**
 * 🆔 GET USER CART
 */
function getCart(userId) {
  if (!userId) return null;

  if (!carts.has(userId)) {
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

    // 🔁 Check if already in cart
    const existing = cart.find((item) => item.productId === productId);

    if (existing) {
      existing.quantity += quantity;
    } else {
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
    logger.error("Add to Cart Error:", error.message);

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
    logger.error("Remove from Cart Error:", error.message);

    return {
      success: false,
    };
  }
}

/**
 * 🧾 GET CART TOTAL
 */
function getCartTotal(userId) {
  try {
    const cart = getCart(userId);

    const total = cart.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    return total;

  } catch (error) {
    logger.error("Cart Total Error:", error.message);
    return 0;
  }
}

/**
 * 🧹 CLEAR CART
 */
function clearCart(userId) {
  try {
    carts.set(userId, []);
    return true;
  } catch (error) {
    logger.error("Clear Cart Error:", error.message);
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
