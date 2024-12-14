const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/auth");
require("dotenv").config();
const upload = require("./uploads/upload"); // Custom multer config
const { createProfile, getProfile } = require("./Controller/Profile");
const { getPendingVideos, approveVideo } = require("./Controller/admin");
const {
  getAuthUrl,
  getAccessToken,
  uploadVideo,
} = require("./Controller/youtube");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/auth", authRoutes);

app.post(
  "/api/create-profile",
  upload.fields([{ name: "photos" }, { name: "video" }]),
  createProfile
);

// OAuth route to start the authentication process
app.get("/auth/google", (req, res) => {
  res.redirect(getAuthUrl());
});

// OAuth callback route
app.get("/auth/callback", async (req, res) => {
  try {
    const tokens = await getAccessToken(req.query.code); // Get access token
    res.json({ message: "Authorized", tokens });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to authorize", details: err.message });
  }
});

// Upload video after getting video details
app.post("/upload-video", async (req, res) => {
  const { videoPath, title, description } = req.body; // Ensure these are passed in the request body

  try {
    const videoData = await uploadVideo(videoPath, title, description); // Upload video to YouTube
    res.json({ message: "Video uploaded successfully", data: videoData });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to upload video", details: err.message });
  }
});

// API routes
app.post(
  "/api/create-profile",
  upload.fields([{ name: "photos" }, { name: "video" }]), // Multer for file upload
  createProfile
);

app.get("/api/profile/:email", getProfile);

app.get("/api/admin/pending-videos", getPendingVideos);
app.post("/api/admin/update-approval", approveVideo);

app.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code; // The authorization code that Google sends in the URL
  if (!code) {
    return res.status(400).json({ message: "Authorization code missing." });
  }

  try {
    // Use the code to get the access token
    const tokens = await getAccessToken(code);
    res.json({ message: "Authentication successful!", tokens });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Authentication failed.", error: error.message });
  }
});

// Server
const PORT = 10000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
