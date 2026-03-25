// interface/ui/search/searchResults.js

const { buildCTAGroup } = require("../components/cta");

function searchResults({ query = "", results = [] } = {}) {
  if (!Array.isArray(results)) results = [];

  const topResults = results.slice(0, 3); // WhatsApp button limit

  let message =
`🔍 *Search Results*
Query: "${query}"

Select a product below:`;

  if (topResults.length === 0) {
    message += `\n\nNo products found.`;
  }

  const buttons = buildCTAGroup(
    topResults.map((product) => ({
      id: `view_${product.id}`,
      title: truncate(product.name)
    }))
  );

  return {
    type: "interactive",
    message,
    buttons,
    meta: {
      screen: "search_results",
      query,
      resultCount: results.length
    }
  };
}

function truncate(text = "", limit = 20) {
  if (text.length <= limit) return text;
  return text.substring(0, limit - 3) + "...";
}

module.exports = searchResults;
