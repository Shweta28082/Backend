const express = require("express");
const { check, validationResult } = require("express-validator");
const db = require("../db");

const router = express.Router();

// Signup route
router.post("/signup", (req, res) => {
  const { name, email, password } = req.body;

  // Check if email exists
  const checkEmailQuery = "SELECT * FROM users WHERE email = ?";
  db.query(checkEmailQuery, [email], (err, result) => {
    if (err) {
      console.error("Database error during email check:", err.message);
      return res.status(500).json({ error: "Database error" });
    }

    if (result.length > 0) {
      return res.status(409).json({ error: "Email already exists" });
    }

    // Insert new user if email doesn't exist
    const insertQuery = "INSERT INTO users (name, email, password) VALUES (?)";
    const values = [name, email, password];
    db.query(insertQuery, [values], (err, data) => {
      if (err) {
        console.error("Signup error:", err.message);
        return res.status(500).json({ error: "Database error" });
      }

      return res.status(201).json({ message: "User registered successfully" });
    });
  });
});

// Login route
// router.post("/login", (req, res) => {
//   console.log("Received data for login:", req.body); // Debugging

//   const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
//   console.log("Executing query:", sql, [req.body.email, req.body.password]);

//   db.query(sql, [req.body.email, req.body.password], (err, data) => {
//     if (err) {
//       console.error("Database error:", err); // Debugging
//       return res.status(500).json({ error: "Database error" });
//     }

//     if (data.length > 0) {
//       // Assuming the `email` field is present in the user record
//       return res.json({ message: "Success", user: { email: data[0].email } });
//     } else {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }
//   });
// });

// Login route
router.post("/login", (req, res) => {
  console.log("Received data for login:", req.body); // Debugging

  const { email, password } = req.body;

  // Step 1: Check if user exists by email
  const checkUserQuery = "SELECT * FROM users WHERE email = ?";
  db.query(checkUserQuery, [email], (err, data) => {
    if (err) {
      console.error("Database error:", err); // Debugging
      return res.status(500).json({ error: "Database error" });
    }

    if (data.length === 0) {
      // User not found
      return res.status(404).json({ error: "User not found" });
    }

    // Step 2: Check if password matches (hash passwords in real applications)
    const user = data[0];
    if (user.password !== password) {
      // Password does not match
      return res.status(401).json({ error: "Password does not match" });
    }

    // Step 3: Successful login
    return res.json({ message: "Success", user: { email: user.email } });
  });
});

module.exports = router;
