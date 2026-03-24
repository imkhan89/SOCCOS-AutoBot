/**
 * Pipeline Integration Layer
 */

const pipeline = require("./pipeline");

async function runPipeline(input) {
  return await pipeline(input);
}

module.exports = {
  runPipeline,
};
