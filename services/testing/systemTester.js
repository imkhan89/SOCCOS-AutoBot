/**
 * SAE-V2 SYSTEM TESTER
 * --------------------------------
 * Simulates full user flow:
 * - Menu
 * - Search
 * - Selection
 * - Order flow
 */

const pipeline = require("../../app/core/pipeline");

async function runTests() {
  const userId = "test_user";

  const testCases = [
    "hi",
    "1",
    "air filter",
    "1",
    "0",
    "john doe",
    "lahore",
    "1",
  ];

  console.log("🚀 Starting System Test...\n");

  for (let i = 0; i < testCases.length; i++) {
    const input = testCases[i];

    console.log(`📥 Input: ${input}`);

    const response = await pipeline({
      from: userId,
      text: input,
    });

    console.log(`📤 Output:`, response, "\n");
  }

  console.log("✅ Test Completed");
}

module.exports = {
  runTests,
};
