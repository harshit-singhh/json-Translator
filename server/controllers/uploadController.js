const db = require("../config/db");

// Predefined mapping of language codes to names
const languageMap = {
  en: "English",
  hi: "Hindi",
  es: "Spanish",
  fr: "French",
  ts: "Testing",
  sm: "Small Test",
};

const uploadData = async (req, res, next) => {
  try {
    const { languageCode, extractedData } = req.body;

    if (!languageCode || !extractedData || typeof extractedData !== "object") {
      return res.status(400).send({
        message: "Invalid request: Missing languageCode or extractedData.",
      });
    }

    const languageName = languageMap[languageCode] || "Unknown";

    // Check if language already exists in the database
    const existingLanguageResult = await db.query(
      `SELECT * FROM uploadedfiles WHERE language_code = $1`,
      [languageCode]
    );

    if (existingLanguageResult.rows.length === 0) {
      await db.query(
        `INSERT INTO uploadedfiles (language_code, language_name) VALUES ($1, $2)`,
        [languageCode, languageName]
      );
    }

    // Insert metadata into the OriginalData table
    const insertQuery = `
      INSERT INTO originaldata (key_name, value, language_code)
      VALUES ($1, $2, $3)
      ON CONFLICT (key_name, language_code)
      DO UPDATE SET value = EXCLUDED.value;
    `;

    // Loop through extractedData and insert each key-value pair
    for (const [key, value] of Object.entries(extractedData)) {
      await db.query(insertQuery, [key, value, languageCode]);
    }

    res.status(200).send({
      message: "Data and metadata uploaded successfully!",
      metadata: { languageCode, languageName },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================================================

const addNewKey = async (req, res, next) => {
  const { key, translations } = req.body;

  if (!key || !translations || typeof translations !== "object") {
    return res.status(400).json({ error: "Invalid request data" });
  }

  console.log("Before inserting new key in originaldata table");

  try {

    // Prepare insert query
    const insertQuery = `
      INSERT INTO originaldata (key_name, value, language_code)
      VALUES ($1, $2, $3)
      ON CONFLICT (key_name, language_code)
      DO UPDATE SET value = EXCLUDED.value;
    `;

    // Loop over each translation and insert individually
    for (const [languageCode, value] of Object.entries(translations)) {
      if (languageCode && value) {
        await db.query(insertQuery, [key, value, languageCode]);
      }
    }

    console.log("Inserted new key and translations successfully.");
    res
      .status(201)
      .json({ message: "New key and translations added successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadData,
  addNewKey,
};
