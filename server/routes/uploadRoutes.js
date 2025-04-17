const express = require("express");
const router = express.Router();
const { uploadData, addNewKey } = require("../controllers/uploadController");


router.post("/upload", uploadData);


router.post("/addKey", addNewKey);

module.exports = router;
