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
router.post("/login", (req, res) => {
  console.log("Received data for login:", req.body); // Debugging

  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
  console.log("Executing query:", sql, [req.body.email, req.body.password]);

  db.query(sql, [req.body.email, req.body.password], (err, data) => {
    if (err) {
      console.error("Database error:", err); // Debugging
      return res.status(500).json({ error: "Database error" });
    }

    if (data.length > 0) {
      // Assuming the `email` field is present in the user record
      return res.json({ message: "Success", user: { email: data[0].email } });
    } else {
      return res.status(401).json({ error: "Invalid credentials" });
    }
  });
});

module.exports = router;
