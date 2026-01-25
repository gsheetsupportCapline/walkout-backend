const { google } = require("googleapis");
const moment = require("moment-timezone");
const ProviderSchedule = require("../models/ProviderSchedule");

// Google Sheets configuration
const SHEET_ID = "1GK8lWBc3rXgtnm6hzxcFS_ueS0QGb5tBGaKdskSFzuA";
const SHEET_NAME = "Helping";
const RANGE = "A1:G";

/**
 * Get current CST date-time
 */
const getCSTDateTime = () => {
  return moment().tz("America/Chicago").format("YYYY-MM-DD HH:mm:ss [CST]");
};

/**
 * Get Google Sheets API client
 */
const getGoogleSheetsClient = () => {
  // Check if credentials file exists, otherwise use environment variables
  let auth;

  if (
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY
  ) {
    // Use environment variables (recommended for production)
    console.log("✓ Using Google Service Account from environment variables");
    console.log(`✓ Email: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`);
    auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
  } else if (process.env.GOOGLE_API_KEY) {
    // Use API Key (simpler but less secure)
    console.log("✓ Using Google API Key from environment variables");
    auth = process.env.GOOGLE_API_KEY;
  } else {
    // Fallback to credentials file
    console.log("⚠ Falling back to credentials.json file");
    auth = new google.auth.GoogleAuth({
      keyFile: "./credentials.json",
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
  }

  return google.sheets({ version: "v4", auth });
};

/**
 * Fetch data from Google Sheet with retry logic
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Array>} - Sheet data rows
 */
const fetchProviderScheduleData = async (retryCount = 0) => {
  const maxRetries = 3;

  try {
    console.log(`\n--- Fetching Provider Schedule from Google Sheet ---`);
    console.log(`Sheet ID: ${SHEET_ID}`);
    console.log(`Tab: ${SHEET_NAME}`);
    console.log(`Range: ${RANGE}`);

    const sheets = getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!${RANGE}`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("⚠ No data found in sheet");
      return [];
    }

    console.log(`✓ Fetched ${rows.length} rows from Google Sheet`);
    return rows;
  } catch (error) {
    console.error(
      `✗ Error fetching sheet data (Attempt ${retryCount + 1}/${maxRetries}):`,
    );
    console.error(`   Error Name: ${error.name}`);
    console.error(`   Error Message: ${error.message}`);
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }
    if (error.errors && error.errors.length > 0) {
      console.error(`   Details:`, JSON.stringify(error.errors, null, 2));
    }

    // Retry logic
    if (retryCount < maxRetries - 1) {
      console.log(`⚠ Retrying in 5 seconds...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return await fetchProviderScheduleData(retryCount + 1);
    }

    // All retries failed
    console.error(`✗ Failed to fetch data after ${maxRetries} attempts`);
    throw error;
  }
};

/**
 * Transform row data to provider schedule object
 * @param {Array} row - Sheet row data
 * @returns {Object} - Transformed provider schedule object
 */
const transformProviderScheduleData = (row) => {
  return {
    dos: row[0] || "", // Column A
    "office-name": row[1] || "", // Column B
    "provider-code": row[2] || "", // Column C
    "provider-hygienist": row[3] || "", // Column D
    "provider-code-with-type": row[4] || "", // Column E
    "provider-full-name": row[5] || "", // Column F
    "provider-type": row[6] || "", // Column G
    "updated-on": getCSTDateTime(),
  };
};

/**
 * Sync provider schedule data from Google Sheet
 * @returns {Promise<Object>} - Sync result
 */
const syncProviderSchedule = async () => {
  try {
    console.log(`\n========================================`);
    console.log(`Provider Schedule Sync Started`);
    console.log(`Time: ${getCSTDateTime()}`);
    console.log(`========================================`);

    // Fetch data from Google Sheet (with retry logic)
    const rows = await fetchProviderScheduleData();

    if (!rows || rows.length === 0) {
      console.log("⚠ No data to sync. Keeping existing data as is.");
      return {
        success: true,
        message: "No data found in sheet",
        inserted: 0,
        updated: 0,
        skipped: 0,
        total: 0,
      };
    }

    // Transform data
    const transformedData = rows
      .map((row) => transformProviderScheduleData(row))
      .filter((item) => item.dos && item["office-name"]); // Only dos and office-name are mandatory

    console.log(`\n✓ Transformed ${transformedData.length} valid records`);

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // Process each record
    for (const data of transformedData) {
      try {
        // Create unique identifier - use provider-code if available, otherwise use provider-full-name or provider-hygienist
        const uniqueIdentifier =
          data["provider-code"] ||
          data["provider-full-name"] ||
          data["provider-hygienist"] ||
          "unknown";

        // Check if record exists (office-name + dos + unique identifier)
        const existingRecord = await ProviderSchedule.findOne({
          "office-name": data["office-name"],
          dos: data.dos,
          $or: [
            { "provider-code": data["provider-code"] || uniqueIdentifier },
            {
              "provider-full-name":
                data["provider-full-name"] || uniqueIdentifier,
            },
          ],
        });

        if (existingRecord) {
          // Check if any field has changed
          const hasChanges =
            existingRecord["provider-code"] !== data["provider-code"] ||
            existingRecord["provider-hygienist"] !==
              data["provider-hygienist"] ||
            existingRecord["provider-code-with-type"] !==
              data["provider-code-with-type"] ||
            existingRecord["provider-full-name"] !==
              data["provider-full-name"] ||
            existingRecord["provider-type"] !== data["provider-type"];

          if (hasChanges) {
            // Update only if there are changes
            await ProviderSchedule.updateOne(
              { _id: existingRecord._id },
              {
                $set: {
                  "provider-code": data["provider-code"],
                  "provider-hygienist": data["provider-hygienist"],
                  "provider-code-with-type": data["provider-code-with-type"],
                  "provider-full-name": data["provider-full-name"],
                  "provider-type": data["provider-type"],
                  "updated-on": getCSTDateTime(),
                },
              },
            );
            updatedCount++;
          } else {
            // No changes, skip
            skippedCount++;
          }
        } else {
          // New record, insert it
          await ProviderSchedule.create(data);
          insertedCount++;
        }
      } catch (error) {
        // Handle duplicate key errors silently
        if (error.code !== 11000) {
          console.error(`Error processing record:`, error.message);
        }
      }
    }

    console.log(`\n========================================`);
    console.log(`✓ Provider Schedule Sync Completed`);
    console.log(
      `New: ${insertedCount} | Updated: ${updatedCount} | Skipped: ${skippedCount}`,
    );
    console.log(`Total Processed: ${transformedData.length}`);
    console.log(`========================================\n`);

    return {
      success: true,
      message: "Provider schedule sync completed",
      inserted: insertedCount,
      updated: updatedCount,
      skipped: skippedCount,
      total: transformedData.length,
    };
  } catch (error) {
    console.error(`\n✗ Provider Schedule Sync Failed:`, error.message);
    console.log(`Keeping existing data as is.\n`);

    return {
      success: false,
      message: "Failed to sync provider schedule after retries",
      error: error.message,
      inserted: 0,
      updated: 0,
      skipped: 0,
      total: 0,
    };
  }
};

module.exports = {
  syncProviderSchedule,
};
