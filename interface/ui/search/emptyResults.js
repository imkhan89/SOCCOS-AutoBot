// interface/ui/search/emptyResults.js

const { buildCTAGroup, chatCTA } = require("../components/cta");

function emptyResults(query = "") {
  const message =
`❌ *No Results Found*

We couldn’t find:
"${query}"

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
    meta: {
      screen: "empty_results",
      query
    }
  };
}

module.exports = emptyResults;
