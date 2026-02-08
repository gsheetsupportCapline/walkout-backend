const cron = require("node-cron");
const { syncAllAnalysisData } = require("../services/analysisDataSyncService");
const { toCSTDateString } = require("../utils/timezone");

/**
 * Initialize Analysis Data Sync Cron Job
 * Syncs Code Compatibility and Allowable Changes data from Google Sheets
 * Runs every 1 hour
 */
const initAnalysisDataSyncCron = () => {
  // Cron expression: Every 1 hour (0 * * * *)
  // Runs at: 00:00, 01:00, 02:00, ..., 23:00
  const cronExpression = "0 * * * *";

  cron.schedule(
    cronExpression,
    async () => {
      console.log("\n🔄 Cron Job Triggered: Analysis Data Sync");
      console.log(`Time: ${toCSTDateString()} CST`);

      try {
        await syncAllAnalysisData();
      } catch (error) {
        console.error("Error in analysis data sync cron job:", error.message);
      }
    },
    {
      scheduled: true,
      timezone: "America/Chicago",
    },
  );

  console.log("✓ Analysis Data sync cron job initialized");
  console.log(`✓ Schedule: Every 1 hour`);
  console.log(`✓ Cron Expression: ${cronExpression}`);
  console.log(`✓ Timezone: America/Chicago (CST)`);
  console.log(`✓ Syncs: Code Compatibility & Allowable Changes from Google Sheets`);
};

module.exports = { initAnalysisDataSyncCron };
