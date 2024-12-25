const db = require("../db"); // Database connection
const fs = require("fs");
const path = require("path");
const { uploadVideo } = require("../Controller/youtube"); // Import the uploadVideo function
const { sendMail } = require("../helpers/SendMail"); // Import sendMail function

// Fetch pending videos
const getPendingVideos = (req, res) => {
  db.query(
    "SELECT id, email, video_url FROM users WHERE approval_status = 'pending'",
    (err, results) => {
      if (err) {
        console.error("Error fetching pending videos:", err);
        return res
          .status(500)
          .json({ error: "Failed to fetch pending videos." });
      }
      res.json(
        results.length ? results : { message: "No pending videos found." }
      );
    }
  );
};

// Approve video and upload to YouTube
const approveVideo = async (req, res) => {
  const { profileId } = req.body;

  if (!profileId) {
    return res.status(400).json({ error: "Profile ID is required." });
  }

  try {
    // Fetch video details
    const [results] = await db
      .promise()
      .query(
        "SELECT video_url, name, email FROM users WHERE id = ? AND approval_status = 'pending'",
        [profileId]
      );

    if (!results.length) {
      return res
        .status(404)
        .json({ error: "No pending video found for the given profile ID." });
    }

    const { video_url: videoPath, name, email } = results[0];
    const absolutePath = path.join(__dirname, "..", videoPath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(400).json({ error: "Video file not found on server." });
    }

    // Update the user's approval status
    await db
      .promise()
      .query("UPDATE users SET approval_status = 'approved' WHERE id = ?", [
        profileId,
      ]);

    // Upload video to YouTube
    const title = `${name}'s Approved Video`;
    const description = `This video was uploaded automatically after approval for ${name}.`;

    const videoData = await uploadVideo(absolutePath, title, description);
    console.log("Video uploaded successfully:", videoData);

    // Define email content (fixed on the server)
    const subject = "Your Video Has Been Approved";
    const text = `Dear ${name},\n\nYour video has been approved and successfully uploaded to YouTube.\n\nBest regards,\nYour Team`;
    const html = `<p>Dear ${name},</p><p>Your video has been approved and successfully uploaded to YouTube.</p><p>Best regards,<br>Your Team</p>`;

    // Send email
    await sendMail(email, subject, text, html);

    res.json({
      message: "Video approved, uploaded to YouTube, and email sent.",
      videoData,
    });
  } catch (err) {
    console.error("Error in approveVideo:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
};

// Export functions
module.exports = { getPendingVideos, approveVideo };
