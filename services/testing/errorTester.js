/**
 * SAE-V2 ERROR TESTER
 * --------------------------------
 * Tests edge cases:
 * - Invalid inputs
 * - Empty values
 * - Unexpected flows
 */

const pipeline = require("../../app/core/pipeline");

async function runErrorTests() {
  const userId = "error_test_user";

  const testCases = [
    "",                 // empty
    "   ",              // spaces
    null,               // null input
    "999",              // invalid selection
    "randomtextxyz",    // unknown input
    "@@@@",             // special chars
    "0",                // invalid flow step
  ];

  console.log("🚨 Starting Error Tests...\n");

  for (let i = 0; i < testCases.length; i++) {
    const input = testCases[i];

    console.log(`📥 Input:`, input);

    try {
      const response = await pipeline({
        from: userId,
        text: input,
      });

      console.log(`📤 Output:`, response, "\n");

    } catch (error) {
      console.error("❌ Crash Detected:", error.message);
    }
  }

  console.log("✅ Error Testing Completed");
}

module.exports = {
  runErrorTests,
};
