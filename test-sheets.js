const { google } = require("googleapis");
require("dotenv").config();

const testSheetsAccess = async () => {
  try {
    console.log("Testing Google Sheets Access...\n");

    // Check credentials
    console.log("Email:", process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.log(
      "Private Key exists:",
      !!process.env.GOOGLE_PRIVATE_KEY,
      "\n",
    );

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const SHEET_ID = "1GK8lWBc3rXgtnm6hzxcFS_ueS0QGb5tBGaKdskSFzuA";
    const SHEET_NAME = "Helping";
    const RANGE = "A1:G";

    console.log(`Fetching from Sheet ID: ${SHEET_ID}`);
    console.log(`Tab: ${SHEET_NAME}`);
    console.log(`Range: ${RANGE}\n`);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!${RANGE}`,
    });

    const rows = response.data.values;

    console.log(`Total rows fetched: ${rows?.length || 0}`);

    if (rows && rows.length > 0) {
      console.log("\nFirst 5 rows:");
      rows.slice(0, 5).forEach((row, index) => {
        console.log(`Row ${index}:`, row);
      });

      console.log("\nSample data structure:");
      console.log("Column 0 (DOS):", rows[1]?.[0]);
      console.log("Column 1 (Office):", rows[1]?.[1]);
      console.log("Column 2 (Provider Code):", rows[1]?.[2]);
    }
  } catch (error) {
    console.error("Error:", error.message);
    if (error.code) console.error("Code:", error.code);
  }
};

testSheetsAccess();
