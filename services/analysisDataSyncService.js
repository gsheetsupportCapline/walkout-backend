const { google } = require("googleapis");
const CodeCompatibility = require("../models/CodeCompatibility");
const AllowableChanges = require("../models/AllowableChanges");
const { toCSTDateString } = require("../utils/timezone");

// Google Sheets configuration
const SHEET_ID = "1fjdmSFDOk7rFoiayHVHrWWChSTtaYsu12fvF5u5WOt4";
const CODE_COMPATIBILITY_SHEET = "Code Compatibility";
const ALLOWABLE_CHANGES_SHEET = "Allowable Changes";

/**
 * Get Google Sheets API client
 */
const getGoogleSheetsClient = () => {
  let auth;

  if (
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY
  ) {
    console.log("✓ Using Google Service Account from environment variables");
    auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
  } else if (process.env.GOOGLE_API_KEY) {
    console.log("✓ Using Google API Key from environment variables");
    auth = process.env.GOOGLE_API_KEY;
  } else {
    console.log("⚠ Falling back to credentials.json file");
    auth = new google.auth.GoogleAuth({
      keyFile: "./credentials.json",
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
  }

  return google.sheets({ version: "v4", auth });
};

/**
 * Sync Code Compatibility data from Google Sheet to MongoDB
 * @returns {Promise<Object>} Sync result with counts
 */
const syncCodeCompatibility = async () => {
  try {
    console.log("\n--- Syncing Code Compatibility Data ---");
    const sheets = getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${CODE_COMPATIBILITY_SHEET}!A:D`,
    });

    const rows = response.data.values;

    if (!rows || rows.length <= 1) {
      console.log("⚠ No data found in Code Compatibility sheet");
      return { success: false, message: "No data found" };
    }

    const syncTime = toCSTDateString();
    let syncedCount = 0;
    let skippedCount = 0;

    // Skip header row (index 0), start from row 1
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const serviceCode = row[1]; // Column B
      const compatibleCodesStr = row[3]; // Column D

      // Skip if service code is empty
      if (!serviceCode) {
        skippedCount++;
        continue;
      }

      // Parse compatible codes (comma-separated string)
      const compatibleCodes = compatibleCodesStr
        ? compatibleCodesStr
            .toString()
            .split(",")
            .map((s) => s.trim().toUpperCase())
            .filter((s) => s)
        : [];

      // Upsert to MongoDB
      await CodeCompatibility.findOneAndUpdate(
        { serviceCode: serviceCode.toUpperCase() },
        {
          serviceCode: serviceCode.toUpperCase(),
          compatibleCodes: compatibleCodes,
          lastSyncedAt: syncTime,
        },
        { upsert: true, new: true }
      );

      syncedCount++;
    }

    console.log(`✓ Code Compatibility Sync Complete`);
    console.log(`  - Synced: ${syncedCount}`);
    console.log(`  - Skipped: ${skippedCount}`);

    return {
      success: true,
      synced: syncedCount,
      skipped: skippedCount,
      syncedAt: syncTime,
    };
  } catch (error) {
    console.error("✗ Code Compatibility sync failed:", error.message);
    throw error;
  }
};

/**
 * Sync Allowable Changes data from Google Sheet to MongoDB
 * @returns {Promise<Object>} Sync result with counts
 */
const syncAllowableChanges = async () => {
  try {
    console.log("\n--- Syncing Allowable Changes Data ---");
    const sheets = getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${ALLOWABLE_CHANGES_SHEET}!A:C`,
    });

    const rows = response.data.values;

    if (!rows || rows.length <= 1) {
      console.log("⚠ No data found in Allowable Changes sheet");
      return { success: false, message: "No data found" };
    }

    const syncTime = toCSTDateString();
    let syncedCount = 0;
    let skippedCount = 0;

    // Clear existing data before syncing
    await AllowableChanges.deleteMany({});

    // Skip header row (index 0), start from row 1
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const originalService = row[1]; // Column B
      const alternativeService = row[2]; // Column C

      // Skip if either service code is empty
      if (!originalService || !alternativeService) {
        skippedCount++;
        continue;
      }

      // Insert to MongoDB
      await AllowableChanges.create({
        originalService: originalService.toUpperCase(),
        alternativeService: alternativeService.toUpperCase(),
        lastSyncedAt: syncTime,
      });

      syncedCount++;
    }

    console.log(`✓ Allowable Changes Sync Complete`);
    console.log(`  - Synced: ${syncedCount}`);
    console.log(`  - Skipped: ${skippedCount}`);

    return {
      success: true,
      synced: syncedCount,
      skipped: skippedCount,
      syncedAt: syncTime,
    };
  } catch (error) {
    console.error("✗ Allowable Changes sync failed:", error.message);
    throw error;
  }
};

/**
 * Sync both Code Compatibility and Allowable Changes
 * @returns {Promise<Object>} Combined sync result
 */
const syncAllAnalysisData = async () => {
  try {
    console.log("\n========================================");
    console.log("🔄 Starting Analysis Data Sync");
    console.log("========================================");

    const codeCompatibilityResult = await syncCodeCompatibility();
    const allowableChangesResult = await syncAllowableChanges();

    console.log("\n========================================");
    console.log("✓ Analysis Data Sync Complete");
    console.log("========================================\n");

    return {
      success: true,
      codeCompatibility: codeCompatibilityResult,
      allowableChanges: allowableChangesResult,
      syncedAt: toCSTDateString(),
    };
  } catch (error) {
    console.error("\n✗ Analysis Data Sync Failed:", error.message);
    throw error;
  }
};

module.exports = {
  syncCodeCompatibility,
  syncAllowableChanges,
  syncAllAnalysisData,
};
