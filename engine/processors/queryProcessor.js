/**
 * SOCCOS-AutoBot
 * Query Processor (FINAL - FIXED)
 */

function queryProcessor(text = "") {
  try {
    if (typeof text !== "string") return "";

    /**
     * STEP 1 — NORMALIZE
     */
    let query = text
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!query) return "";

    /**
     * STEP 2 — REMOVE SAFE STOPWORDS
     */
    const stopWords = new Set([
      "please",
      "need",
      "want",
      "show",
      "me",
      "the",
      "a",
      "an",
      "for"
    ]);

    let tokens = query
      .split(" ")
      .filter((word) => word && !stopWords.has(word));

    if (tokens.length === 0) return "";

    /**
     * STEP 3 — REJOIN
     */
    query = tokens.join(" ");

    /**
     * STEP 4 — AUTOMOTIVE NORMALIZATION
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

    for (const key in replacements) {
      if (query.includes(key)) {
        query = query.split(key).join(replacements[key]);
      }
    }

    /**
     * STEP 5 — FINAL CLEAN
     */
    query = query.replace(/\s+/g, " ").trim();

    return query;

  } catch (error) {
    console.error("QueryProcessor Error:", error.message);
    return "";
  }
}

module.exports = queryProcessor;
