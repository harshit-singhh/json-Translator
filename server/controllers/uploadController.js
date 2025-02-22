const db = require("../config/db");

// Predefined mapping of language codes to names
const languageMap = {
  en: "English",
  hi: "Hindi",
  es: "Spanish",
  fr: "French",
  ts: "Testing",
  sm: "Small Test"
};

const uploadData = async (req, res) => {
  try {
    const { languageCode, extractedData } = req.body;

    // This is how extracted data must be looking
    // const extractedData = [
    //   { key: "greeting", value: "Hello" },
    //   { key: "farewell", value: "Goodbye" },
    //   { key: "thanks", value: "Thank you" },
    // ];

    if (!languageCode || !extractedData || !Array.isArray(extractedData)) {
      return res.status(400).send({
        message: "Invalid request: Missing languageCode or extractedData.",
      });
    }

    // Determine language name
    const languageName = languageMap[languageCode] || "Unknown";

    // Check if language already exists in the database
    const existingLanguageResult = await db.query(
      "SELECT * FROM UploadedFiles WHERE language_code = ?",
      [languageCode]
    );

    const [existingLanguage] = existingLanguageResult;

    console.log("existingLanguageSize is " , existingLanguage.length);

    if (existingLanguage.length === 0) {
      await db.query(
        "INSERT INTO UploadedFiles (language_code, language_name) VALUES (?, ?)",
        [languageCode, languageName]
      );
    }

    // Insert metadata into the UploadedFiles table
    

    // Prepare data for insertion into OriginalData table
    const insertQuery = `
      INSERT INTO OriginalData (key_name, value, language_code) 
      VALUES ? 
      ON DUPLICATE KEY UPDATE 
      value = VALUES(value);
    `;

    const values = extractedData.map((item) => [
      item.key,
      item.value,
      languageCode,
    ]);

    await db.query(insertQuery, [values]);

    res.status(200).send({
      message: "Data and metadata uploaded successfully!",
      metadata: { languageCode, languageName },
    });
  } catch (error) {
    console.error("Error processing data:", error);
    res.status(500).send({ message: "Error processing data." });
  }
};


module.exports = {
  uploadData,
};
