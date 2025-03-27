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

// const uploadData = async (req, res) => {
//   try {
//     const { languageCode, extractedData } = req.body;

//     // console.log("languageCode is ", languageCode);
//     // console.log("extractedData is ", extractedData);

//     if (!languageCode || !extractedData || typeof extractedData !== "object") {
//       return res.status(400).send({
//         message: "Invalid request: Missing languageCode or extractedData.",
//       });
//     }

//     // Determine language name
//     const languageName = languageMap[languageCode] || "Unknown";

//     // Check if language already exists in the database
//     const existingLanguageResult = await db.query(
//       "SELECT * FROM UploadedFiles WHERE language_code = ?",
//       [languageCode]
//     );

//     const [existingLanguage] = existingLanguageResult;

//     console.log("existingLanguageSize is ", existingLanguage.length);

//     if (existingLanguage.length === 0) {
//       await db.query(
//         "INSERT INTO UploadedFiles (language_code, language_name) VALUES (?, ?)",
//         [languageCode, languageName]
//       );
//     }

//     // Insert metadata into the UploadedFiles table
//     const insertQuery = `
//       INSERT INTO OriginalData (key_name, value, language_code)
//       VALUES ?
//       ON DUPLICATE KEY UPDATE
//       value = VALUES(value);
//     `;

//     const values = [];
//     for (const key in extractedData) {
//       values.push([key, extractedData[key], languageCode]);
//     }

//     await db.query(insertQuery, [values]);

//     res.status(200).send({
//       message: "Data and metadata uploaded successfully!",
//       metadata: { languageCode, languageName },
//     });
//   } catch (error) {
//     console.error("Error processing data:", error);
//     res.status(500).send({ message: "Error processing data." });
//   }
// };

const uploadData = async (req, res) => {
  try {
    const { languageCode, extractedData } = req.body;

    if (!languageCode || !extractedData || typeof extractedData !== "object") {
      return res.status(400).send({
        message: "Invalid request: Missing languageCode or extractedData.",
      });
    }

    // Determine language name
    const languageName = languageMap[languageCode] || "Unknown";

    // ✅ Check if language already exists in the database
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

    // ✅ Insert metadata into the OriginalData table
    const insertQuery = `
      INSERT INTO originaldata (key_name, value, language_code) 
      VALUES ${Object.keys(extractedData)
        .map(
          (_, index) =>
            `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`
        )
        .join(", ")}
      ON CONFLICT (key_name, language_code) DO UPDATE 
      SET value = EXCLUDED.value;
    `;

    const values = [];
    for (const key in extractedData) {
      values.push(key, extractedData[key], languageCode);
    }

    await db.query(insertQuery, values);

    res.status(200).send({
      message: "Data and metadata uploaded successfully!",
      metadata: { languageCode, languageName },
    });
  } catch (error) {
    console.error("❌ Error processing data:", error);
    res.status(500).send({ message: "Error processing data." });
  }
};




// ====================================================================

// const addNewKey = async (req, res) => {
//   const { key, translations } = req.body;

//   if (!key || !translations || typeof translations !== "object") {
//     return res.status(400).json({ error: "Invalid request data" });
//   }

//   console.log("Before inserting new key in originalData table");

//   try {
//     // Prepare values for bulk insertion
//     const values = [];

//     for (const [langCode, value] of Object.entries(translations)) {
//       if (langCode && value) {
//         values.push([key, value, langCode]);
//       }
//     }

//     if (values.length === 0) {
//       return res.status(400).json({ error: "No valid translations provided" });
//     }

//     // SQL bulk insert query
//     const insertQuery = `
//       INSERT INTO originaldata (key_name, value, language_code)
//       VALUES ?
//       ON DUPLICATE KEY UPDATE value = VALUES(value);
//     `;

//     // Execute the bulk insert
//     await db.query(insertQuery, [values]);

//     console.log("Inserted new key and translations successfully.");
//     res
//       .status(201)
//       .json({ message: "New key and translations added successfully" });
//   } catch (error) {
//     console.error("Error inserting new key data:", error);
//     res.status(500).json({ error: "Failed to add new key and translations" });
//   }
// };


const addNewKey = async (req, res) => {
  const { key, translations } = req.body;

  if (!key || !translations || typeof translations !== "object") {
    return res.status(400).json({ error: "Invalid request data" });
  }

  console.log("Before inserting new key in originaldata table");

  try {
    // ✅ Prepare values for bulk insertion
    const values = [];
    for (const [langCode, value] of Object.entries(translations)) {
      if (langCode && value) {
        values.push([key, value, langCode]); // ✅ Push each set of 3 as an array
      }
    }

    if (values.length === 0) {
      return res.status(400).json({ error: "No valid translations provided" });
    }

    // ✅ Dynamically build the bulk insert query with placeholders
    const placeholders = values
      .map(
        (_, index) =>
          `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`
      )
      .join(", ");

    const insertQuery = `
      INSERT INTO originaldata (key_name, value, language_code)
      VALUES ${placeholders}
      ON CONFLICT (key_name, language_code) DO UPDATE
      SET value = EXCLUDED.value;
    `;

    // ✅ Flatten the values array for the query
    const flattenedValues = values.flat();

    // ✅ Execute the bulk insert
    await db.query(insertQuery, flattenedValues);

    console.log("✅ Inserted new key and translations successfully.");
    res
      .status(201)
      .json({ message: "New key and translations added successfully" });
  } catch (error) {
    console.error("❌ Error inserting new key data:", error);
    res.status(500).json({ error: "Failed to add new key and translations" });
  }
};







module.exports = {
  uploadData, addNewKey,
};
