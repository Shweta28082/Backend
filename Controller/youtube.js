const { google } = require("googleapis");
const fs = require("fs");
require("dotenv").config(); // Ensure environment variables are loaded

// OAuth2 client setup for YouTube API
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI // Load redirect URI from .env
);

// Function to load tokens from a file
function loadTokens() {
  try {
    const tokens = JSON.parse(fs.readFileSync("tokens.json"));
    oauth2Client.setCredentials(tokens);
    console.log("Tokens loaded successfully.");
  } catch (err) {
    console.warn(
      "No tokens found or invalid tokens. Please authenticate first."
    );
  }
}

// Function to save tokens to a file
function saveTokens(tokens) {
  fs.writeFileSync("tokens.json", JSON.stringify(tokens));
  console.log("Tokens saved successfully.");
}

// Function to generate the YouTube authentication URL
function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/youtube.upload"],
  });
}

// Function to get access token after user authorization
async function getAccessToken(code) {
  try {
    console.log("Authorization code received:", code);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    saveTokens(tokens);
    console.log("Access token retrieved and saved.");
    return tokens;
  } catch (err) {
    console.error("Error retrieving access token:", err.message);
    throw err;
  }
}

// Function to ensure valid credentials
async function ensureValidCredentials() {
  if (!oauth2Client.credentials || !oauth2Client.credentials.access_token) {
    throw new Error(
      "No access, refresh token, or valid credentials set. Authenticate first."
    );
  }

  try {
    const { token } = await oauth2Client.getAccessToken();
    if (!token) {
      throw new Error("Token is invalid or expired. Authenticate again.");
    }
  } catch (err) {
    console.error("Error ensuring valid credentials:", err.message);
    throw err;
  }
}

// Function to upload video to YouTube
async function uploadVideo(
  videoPath,
  title = "Default Title",
  description = "Default Description"
) {
  try {
    await ensureValidCredentials();

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    const res = await youtube.videos.insert({
      part: "snippet,status",
      requestBody: {
        snippet: {
          title,
          description,
        },
        status: {
          privacyStatus: "public",
        },
      },
      media: {
        body: fs.createReadStream(videoPath),
      },
    });

    console.log("Video uploaded successfully:", res.data);
    return res.data;
  } catch (err) {
    console.error("Error uploading video:", err.message);
    throw new Error(
      "Video upload failed. Check YouTube API quota, credentials, or token status."
    );
  }
}

// You can now use this function to start the authentication flow:
const authUrl = getAuthUrl();
console.log("Authenticate via this URL:", authUrl);

// To handle the OAuth2 callback, you would need to exchange the code from the query parameter
// Example: getAccessToken(codeFromCallback) (this would happen after redirect)

// Load tokens on startup
loadTokens();

// Export OAuth2 client, getAuthUrl, getAccessToken, and uploadVideo
module.exports = { oauth2Client, getAuthUrl, getAccessToken, uploadVideo };
