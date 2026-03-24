/**
 * SAE-V2 LOAD TESTER
 * --------------------------------
 * Simulates multiple users concurrently
 * Tests:
 * - Session isolation
 * - Concurrency handling
 * - Stability under load
 */

const pipeline = require("../../app/core/pipeline");

async function simulateUser(userId, inputs) {
  console.log(`👤 Starting session for ${userId}`);

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];

    try {
      const response = await pipeline({
        from: userId,
        text: input,
      });

      console.log(`📥 [${userId}] Input: ${input}`);
      console.log(`📤 [${userId}] Output:`, response);

    } catch (error) {
      console.error(`❌ [${userId}] Crash:`, error.message);
    }
  }

  console.log(`✅ Completed session for ${userId}\n`);
}

/**
 * RUN LOAD TEST
 */
async function runLoadTest() {
  console.log("🚀 Starting Load Test...\n");

  const userFlows = [
    ["hi", "1", "air filter", "1", "0", "Ali", "Lahore", "1"],
    ["hi", "1", "oil filter", "2", "0", "Ahmed", "Karachi", "1"],
    ["hello", "1", "spark plug", "1", "0", "Usman", "Islamabad", "1"],
  ];

  const promises = userFlows.map((flow, index) =>
    simulateUser(`user_${index + 1}`, flow)
  );

  await Promise.all(promises);

  console.log("✅ Load Test Completed");
}

module.exports = {
  runLoadTest,
};
