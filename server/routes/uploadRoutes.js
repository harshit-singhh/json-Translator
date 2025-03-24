const express = require("express");
const router = express.Router();
const { uploadData, addNewKey } = require("../controllers/uploadController");

// Route to handle uploads
router.post("/upload", uploadData);

// Route to add new key and translations
router.post("/addKey", addNewKey);

module.exports = router;
