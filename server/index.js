
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const db = require("./config/db");
const testRoutes = require("./routes/testRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const translationRoutes = require("./routes/translationRoutes");
const errorHandler = require("./middlewares/errorHandler.js");

const app = express();


const PORT = process.env.PORT; 


app.use(cors());
app.use(bodyParser.json());

app.use("/api/uploads", uploadRoutes);
app.use("/api/translations", translationRoutes);
app.use("/api", testRoutes);
app.use(errorHandler);


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
