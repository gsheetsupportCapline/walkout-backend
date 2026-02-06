const axios = require("axios");
const moment = require("moment-timezone");
const { toCSTDateString } = require("../utils/timezone");
const Office = require("../models/Office");
const PatientAppointment = require("../models/PatientAppointment");
const PatientAppointmentArchive = require("../models/PatientAppointmentArchive");
const SyncLog = require("../models/SyncLog");

// CST timezone constant
const CST_TIMEZONE = "America/Chicago";

/**
 * Get current date and time in CST timezone
 */
const getCSTDateTime = () => {
  return toCSTDateString();
};

/**
 * Get current date in CST timezone (YYYY-MM-DD format)
 */
const getCSTDate = () => {
  return moment().tz(CST_TIMEZONE).format("YYYY-MM-DD");
};

/**
 * Get date range for fetching appointments
 * From: First day of last month
 * To: Today (both in CST timezone)
 */
const getDateRange = () => {
  const today = moment().tz(CST_TIMEZONE);
  const firstDayLastMonth = today.clone().subtract(1, "month").startOf("month");

  return {
    startDate: firstDayLastMonth.format("YYYY-MM-DD"),
    endDate: today.format("YYYY-MM-DD"),
  };
};

/**
 * Fetch appointment data from external API
 * @param {string} officeName - Name of the office
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} - Array of appointment data
 */
const fetchAppointmentData = async (officeName, startDate, endDate) => {
  try {
    const API_PASSWORD = process.env.APPOINTMENT_API_PASSWORD || "134568";

    // Convert YYYY-MM-DD to M/D/YYYY format for API
    const formatDateForAPI = (date) => {
      const d = new Date(date);
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    };

    const formattedStartDate = formatDateForAPI(startDate);
    const formattedEndDate = formatDateForAPI(endDate);

    // Build SQL query
    const query = `from patient p JOIN appointment a JOIN chairs c ON a.location_id=c.chair_num JOIN appt_types ap ON ap.type_id = a.appointment_type_id LEFT JOIN employer e ON e.employer_id = p.prim_employer_id LEFT JOIN insurance_company i ON i.insurance_company_id = e.insurance_company_id WHERE (a.confirmation_status = 0 OR a.confirmation_status = 1 OR a.confirmation_status = 2) AND LOWER(c.chair_name) not Like '%ortho%' AND Date(a.start_time) BETWEEN '${formattedStartDate}' AND '${formattedEndDate}'`;

    const selectColumns =
      "p.patient_id,(p.first_name+' '+p.last_name),Date(a.start_time),c.chair_name,i.name,ap.description";

    // Build API URL
    const apiUrl = `https://www.caplineruleengine.com/googleESReport`;

    const params = {
      query: query,
      selectcolumns: selectColumns,
      columnCount: "6",
      office: officeName,
      password: API_PASSWORD,
    };

    console.log(
      `Fetching data for office: ${officeName} (${formattedStartDate} to ${formattedEndDate})`,
    );

    const response = await axios.get(apiUrl, {
      params: params,
      timeout: 40000, // 40 seconds timeout
    });

    // API returns: { message: "", data: [{c1, c2, c3, c4, c5, c6}], status: "OK" }
    // If no data, data array will be empty but status will still be "OK"
    const appointmentData = response.data.data || [];

    console.log(
      `✓ Received ${appointmentData.length} appointments for office: ${officeName}`,
    );

    return appointmentData;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      console.error(
        `✗ Timeout fetching data for office ${officeName} (exceeded 40 seconds)`,
      );
    } else {
      console.error(
        `✗ Error fetching data for office ${officeName}:`,
        error.message,
      );
    }
    throw error;
  }
};

/**
 * Transform API data columns to our schema format
 * @param {Object} apiData - Raw data from API with c1, c2, etc.
 * @param {string} officeName - Office name to add
 * @returns {Object} - Transformed data
 */
const transformData = (apiData, officeName) => {
  return {
    "patient-id": apiData.c1,
    "patient-name": apiData.c2,
    dos: apiData.c3,
    "chair-name": apiData.c4,
    "insurance-name": apiData.c5,
    "insurance-type": apiData.c6,
    "office-name": officeName,
    "updated-on": getCSTDateTime(),
  };
};

/**
 * Sync appointments for a single office
 * @param {Object} office - Office document
 * @param {string} startDate - Start date for fetching
 * @param {string} endDate - End date for fetching
 * @returns {Promise<Object>} - Result with success status and counts
 */
const syncOfficeAppointments = async (office, startDate, endDate) => {
  try {
    const officeName = office.officeName;

    // Fetch data from API
    const apiData = await fetchAppointmentData(officeName, startDate, endDate);

    // If no data received, return without making changes
    if (!apiData || apiData.length === 0) {
      console.log(`No data received for office: ${officeName}`);
      return {
        success: false,
        officeName: officeName,
        reason: "No data received",
        newCount: 0,
        archivedCount: 0,
      };
    }

    // Transform API data
    const transformedData = apiData.map((item) =>
      transformData(item, officeName),
    );

    // Remove duplicates from API data (keep FIRST occurrence)
    // API sometimes sends multiple entries for same patient-id + dos
    const deduplicatedData = [];
    const seenKeys = new Set();

    transformedData.forEach((item) => {
      const key = `${item["patient-id"]}_${item["office-name"]}_${item.dos}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        deduplicatedData.push(item); // Keep first occurrence
      }
    });

    const duplicateCount = transformedData.length - deduplicatedData.length;
    if (duplicateCount > 0) {
      console.log(
        `⚠ Removed ${duplicateCount} duplicate entries from API data for office: ${officeName}`,
      );
    }

    // Get existing appointments for this office
    const existingAppointments = await PatientAppointment.find({
      "office-name": officeName,
    });

    // Create a Set of unique identifiers from API data for quick lookup
    const apiDataSet = new Set(
      deduplicatedData.map(
        (item) => `${item["patient-id"]}_${item["office-name"]}_${item.dos}`,
      ),
    );

    // Find appointments to archive (exist in DB but not in API response)
    // Exclude walk-in appointments from archiving as they are manually created
    const appointmentsToArchive = existingAppointments.filter((existing) => {
      const key = `${existing["patient-id"]}_${existing["office-name"]}_${existing.dos}`;
      // Don't archive walk-in appointments
      if (existing.isWalkIn === true) {
        return false;
      }
      return !apiDataSet.has(key);
    });

    // Archive old appointments
    let archivedCount = 0;
    if (appointmentsToArchive.length > 0) {
      const archiveData = appointmentsToArchive.map((appt) => ({
        "patient-id": appt["patient-id"],
        "patient-name": appt["patient-name"],
        dos: appt.dos,
        "chair-name": appt["chair-name"],
        "insurance-name": appt["insurance-name"],
        "insurance-type": appt["insurance-type"],
        "office-name": appt["office-name"],
        "updated-on": appt["updated-on"],
        "moved-on": getCSTDateTime(),
      }));

      await PatientAppointmentArchive.insertMany(archiveData);

      // Delete from active collection
      await PatientAppointment.deleteMany({
        _id: { $in: appointmentsToArchive.map((a) => a._id) },
      });

      archivedCount = appointmentsToArchive.length;
      console.log(
        `Archived ${archivedCount} appointments for office: ${officeName}`,
      );
    }

    // Insert or update new appointments
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const newAppointments = []; // Track newly inserted appointments
    const updatedAppointments = []; // Track updated appointments with before/after data

    for (const data of deduplicatedData) {
      try {
        // First, check if the appointment already exists
        const existingAppointment = await PatientAppointment.findOne({
          "patient-id": data["patient-id"],
          "office-name": data["office-name"],
          dos: data.dos,
        });

        if (existingAppointment) {
          // Only check if patient-name has changed (ignore chair and insurance)
          const hasChanges =
            existingAppointment["patient-name"] !== data["patient-name"];

          if (hasChanges) {
            // Store before data for logs (only patient-name)
            const beforeData = {
              "patient-name": existingAppointment["patient-name"],
            };

            // Only update patient-name if changed
            // NOTE: mode, createdOn, and createdBy are intentionally NOT updated
            // This preserves manual appointments (mode="manual") when cron updates them
            await PatientAppointment.updateOne(
              {
                "patient-id": data["patient-id"],
                "office-name": data["office-name"],
                dos: data.dos,
              },
              {
                $set: {
                  "patient-name": data["patient-name"],
                  "updated-on": getCSTDateTime(),
                  updatedBy: "cron",
                },
              },
            );
            updatedCount++;

            // Store updated appointment data for logs (only patient-name changed)
            updatedAppointments.push({
              "patient-id": data["patient-id"],
              "patient-name": data["patient-name"],
              dos: data.dos,
              "chair-name": existingAppointment["chair-name"], // Keep existing chair
              "insurance-name": existingAppointment["insurance-name"], // Keep existing insurance
              "insurance-type": existingAppointment["insurance-type"], // Keep existing type
              before: beforeData,
              after: {
                "patient-name": data["patient-name"],
              },
            });
          } else {
            // No changes, skip update and keep old updated-on timestamp
            skippedCount++;
          }
        } else {
          // New appointment, insert it
          await PatientAppointment.create(data);
          insertedCount++;
          // Store new appointment data for logs
          newAppointments.push({
            "patient-id": data["patient-id"],
            "patient-name": data["patient-name"],
            dos: data.dos,
            "chair-name": data["chair-name"],
            "insurance-name": data["insurance-name"],
            "insurance-type": data["insurance-type"],
          });
        }
      } catch (error) {
        // Skip duplicate entries
        if (error.code !== 11000) {
          console.error(`Error processing appointment:`, error.message);
        }
      }
    }

    console.log(
      `✓ Office: ${officeName} | New: ${insertedCount} | Updated: ${updatedCount} | Skipped: ${skippedCount} | Archived: ${archivedCount}`,
    );

    return {
      success: true,
      officeName: officeName,
      newCount: insertedCount,
      updatedCount: updatedCount,
      archivedCount: archivedCount,
      newAppointments: newAppointments,
      updatedAppointments: updatedAppointments,
      archivedAppointments: appointmentsToArchive.map((appt) => ({
        "patient-id": appt["patient-id"],
        "patient-name": appt["patient-name"],
        dos: appt.dos,
        "chair-name": appt["chair-name"],
        "insurance-name": appt["insurance-name"],
        "insurance-type": appt["insurance-type"],
      })),
    };
  } catch (error) {
    console.error(
      `✗ Failed to sync office ${office.officeName}: ${error.message}`,
    );
    return {
      success: false,
      officeName: office.officeName,
      reason: error.message,
      newCount: 0,
      updatedCount: 0,
      archivedCount: 0,
    };
  }
};

/**
 * Main sync function to process all active offices
 * @param {Object} options - Options for sync
 * @param {boolean} options.manualTrigger - Whether manually triggered
 * @param {string} options.triggeredBy - User ID who triggered (if manual)
 * @returns {Promise<Object>} - Sync result summary
 */
const syncAllAppointments = async (options = {}) => {
  const { manualTrigger = false, triggeredBy = null } = options;

  console.log(
    `Starting appointment sync - ${
      manualTrigger ? "MANUAL" : "AUTOMATIC"
    } trigger`,
  );

  try {
    // Get date range
    const { startDate, endDate } = getDateRange();
    console.log(`Date range: ${startDate} to ${endDate}`);

    // Get all active offices
    const activeOffices = await Office.find({ isActive: true });

    if (activeOffices.length === 0) {
      console.log("No active offices found");
      return {
        success: true,
        message: "No active offices to process",
        successfulOffices: [],
        failedOffices: [],
      };
    }

    console.log(`Processing ${activeOffices.length} active offices`);

    // Process all offices concurrently
    const results = await Promise.all(
      activeOffices.map(async (office) => {
        console.log(`\n--- Processing office: ${office.officeName} ---`);
        return await syncOfficeAppointments(office, startDate, endDate);
      }),
    );

    // Separate successful and failed syncs
    const successfulOffices = results
      .filter((r) => r.success)
      .map((r) => ({
        officeName: r.officeName,
        newCount: r.newCount,
        updatedCount: r.updatedCount,
        archivedCount: r.archivedCount,
        newAppointments: r.newAppointments || [],
        updatedAppointments: r.updatedAppointments || [],
        archivedAppointments: r.archivedAppointments || [],
      }));

    const failedOffices = results
      .filter((r) => !r.success)
      .map((r) => ({
        officeName: r.officeName,
        reason: r.reason || "Unknown error",
      }));

    // Update sync log
    const currentDate = getCSTDate();
    const currentDateTime = getCSTDateTime();

    const syncExecution = {
      executedAt: currentDateTime,
      successfulOffices: {
        count: successfulOffices.length,
        offices: successfulOffices,
      },
      failedOffices: {
        count: failedOffices.length,
        offices: failedOffices,
      },
      totalProcessed: activeOffices.length,
      manualTrigger: manualTrigger,
      triggeredBy: triggeredBy,
    };

    await SyncLog.findOneAndUpdate(
      { date: currentDate },
      {
        $push: { executions: syncExecution },
        $inc: { totalExecutions: 1 },
        $set: { lastSyncAt: currentDateTime },
      },
      { upsert: true, new: true },
    );

    console.log(
      `Sync completed - Success: ${successfulOffices.length}, Failed: ${failedOffices.length}`,
    );

    return {
      success: true,
      message: "Sync completed successfully",
      dateRange: { startDate, endDate },
      totalOffices: activeOffices.length,
      successfulOffices: {
        count: successfulOffices.length,
        offices: successfulOffices.map((o) => o.officeName),
        details: successfulOffices,
      },
      failedOffices: {
        count: failedOffices.length,
        offices: failedOffices.map((o) => o.officeName),
        details: failedOffices,
      },
      details: results,
    };
  } catch (error) {
    console.error("Error in syncAllAppointments:", error);
    throw error;
  }
};

module.exports = {
  syncAllAppointments,
  getCSTDateTime,
  getCSTDate,
  getDateRange,
};
