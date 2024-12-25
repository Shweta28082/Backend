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
const approveVideo = (req, res) => {
  const { profileId } = req.body;

  if (!profileId) {
    return res.status(400).json({ error: "Profile ID is required." });
  }

  db.query(
    "SELECT video_url, name, email FROM users WHERE id = ? AND approval_status = 'pending'",
    [profileId],
    (err, results) => {
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
        return res
          .status(400)
          .json({ error: "Video file not found on server." });
      }

      // Update approval status in the database
      db.query(
        "UPDATE users SET approval_status = 'approved' WHERE id = ?",
        [profileId],
        (updateErr) => {
          if (updateErr) {
            console.error("Error updating approval status:", updateErr);
            return res
              .status(500)
              .json({ error: "Failed to update approval status." });
          }

          // Set default title and description for YouTube upload
          const title = `${name}'s Approved Video`;
          const description = `This video was uploaded automatically after approval for ${name}.`;

          // Upload video to YouTube
          uploadVideo(absolutePath, title, description)
            .then((videoData) => {
              console.log("Video uploaded successfully:", videoData);

              // Define email content (fixed on the server)
              const subject = "Your Video Has Been Approved";
              const text = `Dear ${name},\n\nYour video has been approved and successfully uploaded to YouTube.\n\nBest regards,\nYour Team`;
              const html = `<p>Dear ${name},</p><p>Your video has been approved and successfully uploaded to YouTube.</p><p>Best regards,<br>Your Team</p>`;

              // Send email
              sendMail(email, subject, text, html)
                .then(() => {
                  res.json({
                    message:
                      "Video approved, uploaded to YouTube, and email sent.",
                    videoData,
                  });
                })
                .catch((emailErr) => {
                  console.error("Error sending approval email:", emailErr);
                  res
                    .status(500)
                    .json({ error: "Failed to send approval email." });
                });
            })
            .catch((uploadErr) => {
              console.error("Error uploading video to YouTube:", uploadErr);
              res
                .status(500)
                .json({ error: "Failed to upload video to YouTube." });
            });
        }
      );
    }
  );
};

// Export functions
module.exports = { getPendingVideos, approveVideo };
