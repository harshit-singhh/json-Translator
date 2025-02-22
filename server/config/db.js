const mysql = require("mysql2");

// Create a connection pool
const pool = mysql.createPool({
  host: "localhost", // Your MySQL host
  user: "root", // Your MySQL username
  password: "sql@harsh112", // Your MySQL password
  database: "translations_db", // The name of your database
  waitForConnections: true,
  connectionLimit: 10, // Adjust based on your needs
  queueLimit: 0,
});

// Use the pool to check if the connection works
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to MySQL:", err.stack);
    return;
  }
  console.log("MySQL connected with thread id:", connection.threadId);
  console.log("Connected to database:", connection.config.database);

  connection.release(); // Release the connection back to the pool
});

module.exports = pool.promise(); // Export the pool for use in other files
