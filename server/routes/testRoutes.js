const express = require("express");
const router = express.Router();


router.get("/test", (req, res) => {
  res.json({ message: "Backend is connected successfully!" });
});

module.exports = router;
