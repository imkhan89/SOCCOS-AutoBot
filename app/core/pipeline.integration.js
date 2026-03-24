/**
 * Pipeline Integration Layer — FIXED
 */

const pipeline = require("../orchestration/messagePipeline"); // ✅ FIXED PATH

async function runPipeline(input) {
  const response = await pipeline(input); // ✅ ensure await
  return response;
}

module.exports = {
  runPipeline,
};
