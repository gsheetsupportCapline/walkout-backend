const { google } = require("googleapis");

/**
 * Initialize Google Drive with OAuth 2.0 (User's account)
 * This uses your personal Google account storage
 */
const initializeDriveWithOAuth = () => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      "http://localhost:3000/oauth2callback" // Must match redirect URI in console
    );

    // Set refresh token (this will auto-refresh access token)
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
    });

    const drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    return drive;
  } catch (error) {
    console.error("❌ Error initializing Google Drive with OAuth:", error);
    throw error;
  }
};

module.exports = initializeDriveWithOAuth;
