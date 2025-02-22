const express = require("express");
const {
  translateKeys,
  translationEdit,
} = require("../controllers/translationController");

const router = express.Router();

// Route to handle adding a new language (translation request)
router.post("/", translateKeys);

// Route to handle editing an existing translation
router.put("/edit", translationEdit);

module.exports = router;
