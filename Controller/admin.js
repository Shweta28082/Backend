const db = require("../db"); // Database connection
const fs = require("fs");
const { uploadVideo } = require("../Controller/youtube"); // Import the uploadVideo function from youtubeAuth

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
    "SELECT video_url, name FROM users WHERE id = ? AND approval_status = 'pending'",
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

      const { video_url: videoPath, name } = results[0];

      if (!fs.existsSync(videoPath)) {
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

            return res.json({
              message: "Video approved and uploaded to YouTube successfully.",
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
