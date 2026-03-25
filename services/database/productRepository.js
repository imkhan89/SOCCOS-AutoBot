/**
 * Product Repository
 * Handles all product-level DB queries
 */

const mongoose = require("mongoose");

/**
 * Product Schema
 */
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    sku: { type: String, required: true, unique: true },
    category: { type: String, index: true },

    price: { type: Number, required: true },
    salePrice: { type: Number },

    stock: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },

    image: { type: String },

    description: { type: String },

    tags: [{ type: String, index: true }],
  },
  { timestamps: true }
);

/**
 * Text Index for Search
 */
productSchema.index({
  name: "text",
  category: "text",
  tags: "text",
  description: "text",
});

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

/**
 * Get product by ID
 */
async function getProductById(id) {
  return Product.findById(id).lean();
}

/**
 * Get product by SKU
 */
async function getProductBySKU(sku) {
  return Product.findOne({ sku }).lean();
}

/**
 * Search products (text + category)
 */
async function searchProducts({ query, category, limit = 10 }) {
  const filter = {
    isActive: true,
  };

  if (query) {
    filter.$text = { $search: query };
  }

  if (category) {
    filter.category = category;
  }

  return Product.find(filter)
    .limit(limit)
    .lean();
}

/**
 * Get products by category
 */
async function getProductsByCategory(category, limit = 10) {
  return Product.find({
    category,
    isActive: true,
  })
    .limit(limit)
    .lean();
}

/**
 * Reduce stock after order
 */
async function reduceStock(productId, quantity) {
  return Product.findByIdAndUpdate(
    productId,
    { $inc: { stock: -quantity } },
    { new: true }
  );
}

module.exports = {
  getProductById,
  getProductBySKU,
  searchProducts,
  getProductsByCategory,
  reduceStock,
};
