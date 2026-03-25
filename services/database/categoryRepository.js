/**
 * Category Repository
 * Handles category-level DB queries
 */

const mongoose = require("mongoose");

/**
 * Category Schema
 */
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true },

    isActive: { type: Boolean, default: true },

    icon: { type: String }, // optional (for UI buttons / emojis)

    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Category =
  mongoose.models.Category || mongoose.model("Category", categorySchema);

/**
 * Get all active categories
 */
async function getAllCategories() {
  return Category.find({ isActive: true })
    .sort({ sortOrder: 1 })
    .lean();
}

/**
 * Get category by name
 */
async function getCategoryByName(name) {
  return Category.findOne({
    name,
    isActive: true,
  }).lean();
}

/**
 * Get category by slug
 */
async function getCategoryBySlug(slug) {
  return Category.findOne({
    slug,
    isActive: true,
  }).lean();
}

/**
 * Create category (optional admin use)
 */
async function createCategory(data) {
  return Category.create(data);
}

module.exports = {
  getAllCategories,
  getCategoryByName,
  getCategoryBySlug,
  createCategory,
};
