const cron = require("node-cron");
const { syncProviderSchedule } = require("../services/providerScheduleService");
const { toCSTDateString } = require("../utils/timezone");

/**
 * Initialize Provider Schedule Sync Cron Job
 * Runs every 2 hours
 */
const initProviderScheduleCron = () => {
  // Cron expression: Every 2 hours (0 */2 * * *)
  // Runs at: 00:00, 02:00, 04:00, 06:00, 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00
  const cronExpression = "0 */2 * * *";

  cron.schedule(
    cronExpression,
    async () => {
      console.log("\n🔄 Cron Job Triggered: Provider Schedule Sync");
      console.log(`Time: ${toCSTDateString()} CST`);

      try {
        await syncProviderSchedule();
      } catch (error) {
        console.error("Error in provider schedule cron job:", error.message);
      }
    },
    {
      scheduled: true,
      timezone: "America/Chicago",
    },
  );

  console.log("✓ Provider Schedule sync cron job initialized");
  console.log(`✓ Schedule: Every 2 hours`);
  console.log(`✓ Cron Expression: ${cronExpression}`);
  console.log(`✓ Timezone: America/Chicago (CST)`);
  console.log(
    `✓ Next run times: 00:00, 02:00, 04:00, 06:00, 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00 CST`,
  );
};

module.exports = { initProviderScheduleCron };
