/**
 * Script to generate OAuth Refresh Token
 * Run this once to get refresh token for .env file
 *
 * Steps:
 * 1. Create OAuth 2.0 Client ID in Google Cloud Console
 * 2. Add redirect URI: http://localhost:3000/oauth2callback
 * 3. Add CLIENT_ID and CLIENT_SECRET to .env
 * 4. Run: node scripts/generateRefreshToken.js
 * 5. Browser will open automatically, authorize access
 * 6. Copy refresh_token from terminal to .env
 */

const { google } = require("googleapis");
const http = require("http");
require("dotenv").config();

const REDIRECT_URI = "http://localhost:3000/oauth2callback";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  REDIRECT_URI
);

// Scopes for Drive API
const SCOPES = [
  "https://www.googleapis.com/auth/drive.file", // Create and modify files
];

// Generate auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline", // Will return refresh token
  scope: SCOPES,
  prompt: "consent", // Force consent screen to get refresh token
});

console.log("\n🔐 Google Drive OAuth Setup\n");
console.log(
  "📌 Make sure you added this redirect URI to Google Cloud Console:"
);
console.log("   http://localhost:3000/oauth2callback\n");
console.log("🌐 Opening browser for authorization...\n");

// Create local server to receive OAuth callback
const server = http.createServer(async (req, res) => {
  try {
    if (req.url.indexOf("/oauth2callback") > -1) {
      // Extract authorization code from URL
      const url = new URL(req.url, `http://localhost:3000`);
      const code = url.searchParams.get("code");

      if (code) {
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);

        // Send success page to browser
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
          <html>
            <body style="font-family: Arial; padding: 50px; text-align: center;">
              <h1 style="color: #4CAF50;">✅ Authorization Successful!</h1>
              <p>You can close this window and return to the terminal.</p>
            </body>
          </html>
        `);

        // Display tokens in terminal
        console.log("\n✅ Success! Tokens received:\n");
        console.log("Add this to your .env file:\n");
        console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}\n`);

        console.log("\n📝 Your .env should have:");
        console.log("GOOGLE_OAUTH_CLIENT_ID=<your_client_id>");
        console.log("GOOGLE_OAUTH_CLIENT_SECRET=<your_client_secret>");
        console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}\n`);

        // Close server
        server.close();
        process.exit(0);
      } else {
        throw new Error("No authorization code received");
      }
    }
  } catch (error) {
    console.error("\n❌ Error getting tokens:", error.message);
    res.writeHead(500, { "Content-Type": "text/html" });
    res.end(`
      <html>
        <body style="font-family: Arial; padding: 50px; text-align: center;">
          <h1 style="color: #f44336;">❌ Authorization Failed</h1>
          <p>${error.message}</p>
          <p>Check the terminal for details.</p>
        </body>
      </html>
    `);
    server.close();
    process.exit(1);
  }
});

server.listen(3000, async () => {
  console.log("🚀 Local server started on http://localhost:3000");
  console.log("⏳ Waiting for authorization...\n");

  // Open browser automatically using dynamic import
  const open = (await import("open")).default;
  await open(authUrl);
});
