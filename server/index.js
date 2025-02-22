// Require dotenv to load the environment variables
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const db = require("./config/db");
const testRoutes = require("./routes/testRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const translationRoutes = require("./routes/translationRoutes");

const app = express();

// Use environment variables
const PORT = process.env.PORT; // Default to 5000 if PORT is not defined in .env

// Middleware
app.use(cors());
app.use(bodyParser.json());

app.use("/api/uploads", uploadRoutes);
app.use("/api/translations", translationRoutes);
app.use("/api", testRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
