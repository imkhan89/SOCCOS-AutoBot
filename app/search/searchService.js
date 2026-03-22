const index = require("./algoliaClient");

async function searchProducts(query) {
  try {
    const response = await index.search(query, {
      hitsPerPage: 5,
    });

    return response.hits;
  } catch (error) {
    console.error("❌ Algolia Search Error:", error.message);
    return [];
  }
}

module.exports = {
  searchProducts,
};
