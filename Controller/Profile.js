const db = require("../db");
const path = require("path");

// Create or Update Profile Function
exports.createProfile = (req, res) => {
  const {
    email,
    bio,
    phone,

    gender,
    country,
    state,
    city,
    dob,
    height,
    weight,
    acting_experience,
    modeling_experience,
    education,
    acting_course_completed,
    languages,
  } = req.body;

  const files = req.files || {};
  const photoPaths = files["photos"]
    ? files["photos"].map((file) =>
        path.posix.join("uploads/photos", file.filename)
      )
    : [];

  const videoPath =
    files["video"] && files["video"][0]
      ? path.posix.join("uploads/videos", files["video"][0].filename)
      : null;

  const videoUrl = videoPath ? videoPath.replace(/\\/g, "/") : null;

  const sql = `
    INSERT INTO users (email, bio, phone, photos, video_url, approval_status, 
  gender, country, state, city, dob, height, weight, acting_experience, 
  modeling_experience, education, acting_course_completed, languages)
VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
  bio = VALUES(bio),
  phone = VALUES(phone),
  photos = VALUES(photos),
  video_url = VALUES(video_url),
  gender = VALUES(gender),
  country = VALUES(country),
  state = VALUES(state),
  city = VALUES(city),
  dob = VALUES(dob),
  height = VALUES(height),
  weight = VALUES(weight),
  acting_experience = VALUES(acting_experience),
  modeling_experience = VALUES(modeling_experience),
  education = VALUES(education),
  acting_course_completed = VALUES(acting_course_completed),
  languages = VALUES(languages),
  approval_status = 'pending';

  `;

  const values = [
    email,
    bio || null,
    phone || null,
    JSON.stringify(photoPaths) || null,
    videoUrl || null,
    gender || null,
    country || null,
    state || null,
    city || null,
    dob || null,
    height || null,
    weight || null,
    acting_experience || null,
    modeling_experience || null,
    education || null,
    acting_course_completed === "true",
    languages || null,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error updating profile:", err);
      return res
        .status(500)
        .json({ message: "Error updating profile.", error: err });
    }

    res.json({ message: "Profile updated/created successfully." });
  });
};

// Fetch Profile Function
exports.getProfile = (req, res) => {
  const email = req.params.email;

  const sql = `
    SELECT  gender, country, state, city, dob, height, weight,
           acting_experience, modeling_experience, education, acting_course_completed, 
           languages, bio, phone, photos, video_url, approval_status 
    FROM users 
    WHERE email = ?`;

  db.query(sql, [email], (err, result) => {
    if (err) {
      console.error("Error fetching profile:", err);
      return res.status(500).json({ message: "Error fetching profile." });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(result[0]);
  });
};
