// const mysql = require("mysql2");

// // Create a connection pool
// const pool = mysql.createPool({
//   host: "localhost", // Your MySQL host
//   user: "root", // Your MySQL username
//   password: "sql@harsh112", // Your MySQL password
//   database: "translations_db", // The name of your database
//   waitForConnections: true,
//   connectionLimit: 10, // Adjust based on your needs
//   queueLimit: 0,
// });

// // Use the pool to check if the connection works
// pool.getConnection((err, connection) => {
//   if (err) {
//     console.error("Error connecting to MySQL:", err.stack);
//     return;
//   }
//   console.log("MySQL connected with thread id:", connection.threadId);
//   console.log("Connected to database:", connection.config.database);

//   connection.release(); // Release the connection back to the pool
// });

// module.exports = pool.promise(); // Export the pool for use in other files


// ==================================================================================

const { Pool } = require("pg");

// Create a PostgreSQL connection pool
const pool = new Pool({
  host: "localhost", // Your PostgreSQL server
  user: "postgres", // Your PostgreSQL username
  password: "1234", // Your PostgreSQL password
  database: "translations_db", // Your PostgreSQL database name
  port: 5432, // PostgreSQL default port
  max: 10, // Max connections (similar to connectionLimit)
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection can't be established
});

// Verify connection
pool
  .connect()
  .then((client) => {
    console.log("✅ Connected to PostgreSQL database!");
    client.release(); // Release the connection back to the pool
  })
  .catch((err) => {
    console.error("❌ Error connecting to PostgreSQL:", err.stack);
  });

module.exports = pool;

