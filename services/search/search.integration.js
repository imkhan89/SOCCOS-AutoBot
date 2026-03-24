const productSearch = require("./productSearch");
const sessionMemory = require("../../data/memory/sessionMemory");

async function handleSearch(userId, text) {
  const session = sessionMemory.getSession(userId);

  if (session.currentMenu === "search" && !/^\d+$/.test(text)) {
    const results = await productSearch.search(text);

    sessionMemory.updateSession(userId, { lastResults: results });

    return {
      type: "text",
      message: results
        .slice(0, 5)
        .map((p, i) => `${i + 1}. ${p.title}`)
        .join("\n"),
    };
  }

  return null;
}

module.exports = { handleSearch };
