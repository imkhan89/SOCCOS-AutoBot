/**
 * SAE-V2 HEALTH MONITOR
 * --------------------------------
 * Monitors:
 * - System uptime
 * - Basic health stats
 */

let startTime = Date.now();

function getUptime() {
  const uptimeMs = Date.now() - startTime;

  return {
    uptime_seconds: Math.floor(uptimeMs / 1000),
    uptime_minutes: Math.floor(uptimeMs / 60000),
  };
}

function getHealthStatus() {
  return {
    status: "OK",
    uptime: getUptime(),
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  getHealthStatus,
};
