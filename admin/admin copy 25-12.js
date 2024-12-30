const db = require("../db"); // Database connection
const fs = require("fs");
const path = require("path");
const { uploadVideo } = require("../Controller/youtube"); // Import the uploadVideo function from youtubeAuth
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
const approveVideo = (req, res) => {
  const { profileId } = req.body;

  if (!profileId) {
    return res.status(400).json({ error: "Profile ID is required." });
  }

  // Fetch the video details from the database
  db.query(
    "SELECT video_url, name, email FROM users WHERE id = ? AND approval_status = 'pending'",
    [profileId],
    async (err, results) => {
      if (err) {
        console.error("Error fetching video details:", err);
        return res
          .status(500)
          .json({ error: "Failed to fetch video details." });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ error: "No pending video found for the given profile ID." });
      }

      const { video_url: videoPath, name, email } = results[0];

      const absolutePath = path.join(__dirname, "..", videoPath);

      if (!fs.existsSync(absolutePath)) {
        console.error("File not found at:", absolutePath);
        return res
          .status(400)
          .json({ error: "Video file not found on server." });
      }

      // Update approval status in the database
      db.query(
        "UPDATE users SET approval_status = 'approved' WHERE id = ?",
        [profileId],
        async (updateErr) => {
          if (updateErr) {
            console.error("Error updating approval status:", updateErr);
            return res
              .status(500)
              .json({ error: "Failed to update approval status." });
          }

          // Set default title and description
          const title = `${name}'s Approved Video`;
          const description = `This video was uploaded automatically after approval for ${name}.`;

          try {
            // Upload the video to YouTube
            const videoData = await uploadVideo(videoPath, title, description);
            console.log("Video uploaded successfully:", videoData);

            // Send approval email
            console.log("Attempting to send email...");
            console.log("Sending email to:", email); // Ensure the email is correct
            console.log("Email subject:", "Your Video Has Been Approved");
            console.log(
              "Email content:",
              `Dear ${name},\n\nYour video has been approved...`
            );

            try {
              await sendMail(
                email,
                "Your Video Has Been Approved",
                `Dear ${name},\n\nYour video has been approved and successfully uploaded to YouTube.\n\nBest regards,\nYour Team`,
                `<p>Dear ${name},</p><p>Your video has been approved and successfully uploaded to YouTube.</p><p>Best regards,<br>Your Team</p>`
              );
              console.log("Approval email sent successfully");
            } catch (emailErr) {
              console.error("Error sending approval email:", emailErr);
              return res
                .status(500)
                .json({ error: "Failed to send approval email." });
            }

            return res.json({
              message: "Video approved, uploaded to YouTube, and email sent.",
              videoData,
            });
          } catch (uploadErr) {
            console.error("Error uploading video to YouTube:", uploadErr);
            return res
              .status(500)
              .json({ error: "Failed to upload video to YouTube." });
          }
        }
      );
    }
  );
};

// Export functions
module.exports = { getPendingVideos, approveVideo };
