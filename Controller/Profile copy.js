const db = require("../db");
const path = require("path");

// Create or Update Profile Function
exports.createProfile = (req, res) => {
  const { email, bio, phone } = req.body;

  // Log the incoming request for debugging
  console.log("Request received for profile update");

  // Extract files from the request
  const files = req.files || {};

  // Ensure photos are uploaded
  const photoPaths = files["photos"]
    ? files["photos"].map(
        (file) => path.posix.join("uploads/photos", file.filename) // Ensuring proper path formatting
      )
    : [];

  // Ensure a video is uploaded
  const videoPath =
    files["video"] && files["video"][0]
      ? path.posix.join("uploads/videos", files["video"][0].filename) // Ensuring proper path formatting
      : null;

  const videoUrl = videoPath ? videoPath.replace(/\\/g, "/") : null;

  // Log the photo paths and video path for debugging
  console.log("Photo paths:", photoPaths);
  console.log("Video path:", videoUrl);

  // SQL query to create or update the user profile
  const sql = `
    INSERT INTO users (email, bio, phone, photos, video_url, approval_status)
    VALUES (?, ?, ?, ?, ?, 'pending')
    ON DUPLICATE KEY UPDATE
      bio = VALUES(bio),
      phone = VALUES(phone),
      photos = VALUES(photos),
      video_url = VALUES(video_url),
      approval_status = 'pending';
  `;

  // Prepare values for the query
  const values = [
    email,
    bio || null,
    phone || null,
    JSON.stringify(photoPaths) || null,
    videoUrl || null,
  ];

  // Execute the query
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error updating profile:", err);
      return res.status(500).json({
        message: "An error occurred while updating the profile.",
        error: err.sqlMessage || err.message,
      });
    }

    // Check if an existing profile was updated
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "User not found. Unable to update the profile.",
      });
    }

    console.log("Profile updated/created successfully:", result);
    res.json({
      message: "Profile updated/created successfully.",
    });
  });
};

// Fetch Profile Function
exports.getProfile = (req, res) => {
  const email = req.params.email;

  // SQL query to fetch user profile
  const sql = `SELECT bio, phone, photos, video_url, approval_status FROM users WHERE email = ?`;

  db.query(sql, [email], (err, result) => {
    if (err) {
      console.error("Error fetching profile:", err);
      return res.status(500).json({
        message: "An error occurred while fetching the profile.",
        error: err.sqlMessage || err.message,
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.json(result[0]); // Return the first user profile
  });
};
