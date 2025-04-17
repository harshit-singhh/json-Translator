const express = require("express");
const {
  translateKeys,
  translationEdit,
  translateAddedKey,
} = require("../controllers/translationController");

const router = express.Router();


router.post("/", translateKeys);

router.put("/edit", translationEdit);

router.post("/translateAddedKey", translateAddedKey);

module.exports = router;
