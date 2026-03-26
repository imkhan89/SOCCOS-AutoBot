const { buildCTAGroup, chatCTA } = require("../components/cta");

function emptyResults(query = "") {
  const safeQuery = query || "your search";

  const message = `❌ *No Results Found*

We couldn’t find:
"${safeQuery}"

Try a different keyword or explore categories.`;

  const buttons = buildCTAGroup([
    { id: "browse_categories", title: "📦 Browse Categories" },
    { id: "search_again", title: "🔍 Search Again" },
    chatCTA("💬 Ask Support", "chat_support")
  ]);

  return {
    type: "interactive",
    message,
    buttons,
    metadata: {
      screen: "empty_results",
      query: safeQuery
    }
  };
}

module.exports = emptyResults;
