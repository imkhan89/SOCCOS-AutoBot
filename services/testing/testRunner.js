/**
 * SAE-V2 TEST RUNNER
 * --------------------------------
 * Runs all tests in sequence:
 * - System flow test
 * - Error test
 * - Load test
 */

const { runTests } = require("./systemTester");
const { runErrorTests } = require("./errorTester");
const { runLoadTest } = require("./loadTester");

/**
 * MAIN TEST EXECUTION
 */
async function runAllTests() {
  try {
    console.log("=================================");
    console.log("🚀 SAE-V2 FULL TEST SUITE STARTED");
    console.log("=================================\n");

    /**
     * 1. SYSTEM TEST
     */
    console.log("🔹 Running System Flow Test...\n");
    await runTests();

    /**
     * 2. ERROR TEST
     */
    console.log("\n🔹 Running Error Test...\n");
    await runErrorTests();

    /**
     * 3. LOAD TEST
     */
    console.log("\n🔹 Running Load Test...\n");
    await runLoadTest();

    console.log("\n=================================");
    console.log("✅ ALL TESTS COMPLETED SUCCESSFULLY");
    console.log("=================================");

  } catch (error) {
    console.error("❌ Test Runner Failed:", error.message);
  }
}

module.exports = {
  runAllTests,
};
