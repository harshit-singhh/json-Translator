const express = require("express");
const router = express.Router();

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Backend is connected successfully!" });
});

module.exports = router;
