const mysql = require("mysql");

const db = mysql.createConnection({
  host: "risingstar.cdogs6aig4v6.eu-north-1.rds.amazonaws.com", // Updated hostname
  user: "admin", // Updated username
  password: "Rjvirangana8545", // Updated password
  database: "dbname_risingstars", // Assuming you still want to connect to this database
  port: 3306, // Port remains the same
  connectTimeout: 20000,
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
  console.log("Connected to the database.");
});

module.exports = db;
