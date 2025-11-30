const cron = require("node-cron");
const { syncAllAppointments } = require("../services/appointmentService");

/**
 * Initialize cron job for automatic appointment syncing
 * Runs every 3 hours at minute 0
 */
const initAppointmentCron = () => {
  // Run every 3 hours at minute 0
  // Pattern: "0 star-slash-3 star star star" means "At minute 0 past every 3rd hour"
  // Times: 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00
  const cronSchedule = "0 */3 * * *";

  const job = cron.schedule(
    cronSchedule,
    async () => {
      console.log("=".repeat(60));
      console.log(`Cron job started at: ${new Date().toISOString()}`);
      console.log("=".repeat(60));

      try {
        const result = await syncAllAppointments({
          manualTrigger: false,
          triggeredBy: null,
        });

        console.log("Cron job completed successfully");
        console.log(`Successful offices: ${result.successfulOffices.count}`);
        console.log(`Failed offices: ${result.failedOffices.count}`);
      } catch (error) {
        console.error("Error in cron job:", error);
      }

      console.log("=".repeat(60));
    },
    {
      scheduled: true,
      timezone: "America/Chicago", // CST timezone
    }
  );

  console.log("✓ Appointment sync cron job initialized");
  console.log(`✓ Schedule: Every 3 hours (${cronSchedule})`);
  console.log(`✓ Timezone: America/Chicago (CST)`);
  console.log(
    `✓ Next run times: 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00 CST`
  );

  return job;
};

module.exports = { initAppointmentCron };
