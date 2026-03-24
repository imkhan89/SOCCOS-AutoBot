const spellChecker = require("./spellChecker");
const languageDetector = require("./languageDetector");

async function process({ from, text }) {
  let processedText = await spellChecker.correct(text);
  const lang = await languageDetector.detect(processedText);

  return {
    from,
    text: processedText,
    language: lang,
  };
}

module.exports = { process };
