/**
 * SOCCOS-AutoBot
 * Query Processor (FINAL - CLEAN & SEARCH-READY)
 * ----------------------------------------------
 * INPUT: text
 * OUTPUT: normalized query string
 * NO objects returned
 */

function queryProcessor(text = "") {
  try {
    /**
     * STEP 1 — NORMALIZE
     */
    let query = text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/gi, ""); // remove special chars

    if (!query) return "";

    /**
     * STEP 2 — REMOVE LIGHT STOPWORDS (SAFE ONLY)
     */
    const stopWords = [
      "please",
      "need",
      "want",
      "show",
      "me",
      "the",
      "a",
      "an",
      "for"
    ];

    const tokens = query
      .split(" ")
      .filter((word) => word && !stopWords.includes(word));

    /**
     * STEP 3 — JOIN BACK FOR PHRASE NORMALIZATION
     */
    query = tokens.join(" ");

    /**
     * STEP 4 — AUTOMOTIVE NORMALIZATION (PHRASE LEVEL)
     */
    const replacements = {
      brakepad: "brake pad",
      brakepads: "brake pad",
      brakes: "brake",
      oilfilter: "oil filter",
      airfilter: "air filter",
      cabinfilter: "cabin filter",
      sparkplug: "spark plug",
      sparkplugs: "spark plug"
    };

    Object.keys(replacements).forEach((key) => {
      if (query.includes(key)) {
        query = query.replaceAll(key, replacements[key]);
      }
    });

    /**
     * STEP 5 — FINAL CLEANUP
     */
    query = query.trim();

    return query;

  } catch (error) {
    console.error("QueryProcessor Error:", error.message);
    return "";
  }
}

module.exports = queryProcessor;
