const { searchProducts } = require("../search/searchService");

async function messagePipeline(userInput) {
  try {
    const results = await searchProducts(userInput);

    if (!results || results.length === 0) {
      return "No products found.";
    }

    return results
      .map((item, index) => `${index + 1}. ${item.title || item.name}`)
      .join("\n");

  } catch (error) {
    console.error("❌ Pipeline Error:", error.message);
    return "Something went wrong. Please try again.";
  }
}

module.exports = messagePipeline;
