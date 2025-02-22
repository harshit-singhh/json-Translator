const express = require("express");
const router = express.Router();
const { uploadData } = require("../controllers/uploadController");

// Route to handle uploads
router.post("/upload", uploadData);

module.exports = router;
