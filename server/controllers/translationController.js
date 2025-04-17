const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../config/db");

// Predefined translation handler
const translateKeys = async (req, res) => {
  console.log("you reached translateKeys function");

  const {
    selectedlanguageCode,
    selectedlanguageName, parsedData,
    originalDataLanguageCode,
  } = req.body;

  // Validate input

  // console.log(
  //   "the input coming from frontend is ",
  //   selectedlanguageCode,
  //   selectedlanguageName,
  //   parsedData,
  //   originalDataLanguageCode
  // );

  if (!selectedlanguageCode || !parsedData || !originalDataLanguageCode) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Extract values from parsedData
    const valuesArray = Object.values(parsedData["English_en"] || {});

    // console.log("values Array", valuesArray);

    const translationResponse = await getGeminiTranslations(
      parsedData,
      valuesArray,
      selectedlanguageCode,
      selectedlanguageName
    );

    // console.log(
    //   "translations got from gemini function. Now will send this to frontend",
    //   translations
    // );

    const { translations } = translationResponse;

    await saveTranslationsToDB(
      translations, 
      originalDataLanguageCode,
      selectedlanguageCode
    );

    res.status(200).json(translationResponse);
  } catch (error) {
    console.error("Error translating values:", error);
    res.status(500).json({ error: "Failed to translate values" });
  }
};


// Function to get translations from Gemini API
async function getGeminiTranslations(
  parsedData,
  valuesArray,
  languageCode,
  languageName
) {
  const translations = [];
  const batchSize = 25; 
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


  const translateBatch = async (valuesArray) => {
  const prompt = `
  You are a translation assistant. Translate the following **values** into the language whose language code is ${languageCode} and language name is ${languageName}.


  Follow these strict rules:


1) Translate the **values** from the valuesArray.
2) Preserve placeholders like "{}" exactly as they are in the translated text.
3) Translate the text inside HTML tags (like "<b>text</b>") while keeping the HTML structure intact.
4) Return only a **valid JSON** object where **values are translated** while keeping keys unchanged.
5) **Return the JSON response without markdown, backticks, or any extra formatting.**
6) If you need more time to process each value for translation, take more time. Ensure that **all values are translated** and none are left out.
7) **If translation is unclear, do your best to provide the best possible answer. Do not leave translations empty.**
8) **If the key has a full stop (.) Then put that full stop in the translation also, without forgetting**
9) **Ensure the JSON syntax is correct:**  
    - Escape all double quotes inside the translated values with a backslash (\\") to ensure valid JSON formatting. Do not leave any unescaped internal double quotes.
    - **Do NOT add trailing commas or leave out required commas.** 
    - **Always close the JSON with a proper closing brace.**  
    - **Separate each key-value pair with a comma, except the last one.**


  Example:
  **Input Data:**
  [
    "No internet connection",
    "{} Petrol Stations",
    "<style color=\\"#6E7781\\" fontSize=\\"20\\" fontWeight = \\"w400\\">Before getting started</style>",
    "Add Fuel Station",
  ]


  **Expected JSON Output if language code is "hi" (without markdown or extra formatting):**
  {
    "No internet connection": "इंटरनेट कनेक्शन नहीं",
    "{} Petrol Stations": "{} पेट्रोल स्टेशन",
    "<style color=\\"#6E7781\\" fontSize=\\"20\\" fontWeight = \\"w400\\">Before getting started</style>": "<style color=\\"#6E7781\\" fontSize=\\"20\\" fontWeight = \\"w400\\">शुरू करने से पहले</style>",
    "Add Fuel Station": "ईंधन स्टेशन जोड़ें"
  }


  **Here is the actual data to translate:**
  ${JSON.stringify(valuesArray)}
`;

  try {
      const result = await model.generateContent(prompt);
    const translatedText = result.response.text().trim();


      // console.log(`Raw Translated Text:`, translatedText);
      const parsedTranslations = JSON.parse(translatedText);
      console.log(`Batch Translations:`, parsedTranslations);

      return parsedTranslations;
    } catch (error) {
      console.error(`Error translating batch:`, error);
      // Return empty translations on failure
      throw error;
    }
  };

  try {

    const batches = [];
    for (let i = 0; i < valuesArray.length; i += batchSize) {
      batches.push(valuesArray.slice(i, i + batchSize));
    }

    console.log(
      `📦 Sending ${batches.length} batches with batch size: ${batchSize}`
    );

    let isBatchFailed = false; 

    // Sending all batches concurrently using Promise.allSettled
    const batchResults = await Promise.allSettled(
      batches.map((batch) => translateBatch(batch))
    );

    // Merging all batch responses into a single object
    const combinedTranslations = batchResults
      .filter((result) => result.status === "fulfilled")
      .reduce((acc, batchResult) => {
        return { ...acc, ...batchResult.value };
      }, {});

    // Check if any batch failed
    isBatchFailed = batchResults.some((result) => result.status === "rejected");

    // console.log(`Combined Translations:`, combinedTranslations);
    console.log(`Batch Translation Failed: ${isBatchFailed}`);

    const translations = [];
    for (const key in parsedData["English_en"]) {
      const originalValue = parsedData["English_en"][key];
      const translatedValue =
        combinedTranslations[originalValue] || "Error fetching translation";

      translations.push({
        key: key, // Key from English_en
        value: originalValue, // Value from English_en
        translation: translatedValue, // Translated value
      });
    }

    return {
      BatchTranslationResult: !isBatchFailed, // true if all batches succeed, false if any fail
      translations,
    };
  } catch (error) {
    console.error("Error in multi-token translation:", error);

    // Handle any major errors by setting a default error message
    const translations = [];
    for (const key in parsedData["English_en"]) {
      translations.push({
        key: key,
        value: parsedData["English_en"][key],
        translation: "Error fetching translation",
      });
    }

    return {
      BatchTranslationResult: false, // Return false on complete failure
      translations,
    };
  }

}

// ===========================================================================================

async function saveTranslationsToDB(
  translations,
  originalDataLanguageCode,
  translatedLanguageCode
) {
  try {
    // Prepare values for bulk insertion
    const values = translations.map(({ key, value, translation }) => [
      key, 
      value, 
      originalDataLanguageCode, 
      translation, 
      translatedLanguageCode, 
      "AI", 
    ]);

    if (values.length === 0) {
      console.log("No translations to save.");
      return;
    }

    // Dynamically generate PostgreSQL placeholders
    const placeholders = values
      .map(
        (_, index) =>
          `($${index * 6 + 1}, $${index * 6 + 2}, $${index * 6 + 3}, $${
            index * 6 + 4
          }, $${index * 6 + 5}, $${index * 6 + 6})`
      )
      .join(", ");

    // PostgreSQL upsert query
    const query = `
      INSERT INTO translations 
      (Original_data_keys, Original_data_value, Original_Data_Language_Code, translated_value, translated_language_code, translated_by)
      VALUES ${placeholders}
      ON CONFLICT (Original_data_keys, Original_Data_Language_Code, translated_language_code)
      DO UPDATE SET
        translated_value = EXCLUDED.translated_value,
        translated_language_code = EXCLUDED.translated_language_code,
        translated_by = EXCLUDED.translated_by,
        translated_at = CURRENT_TIMESTAMP;
    `;

    // Flatten the values array for parameterized query execution
    const flatValues = values.flat();

    console.log("------------------------------------------------------");
    console.log("Values to insert in PostgreSQL:", flatValues);
    console.log("------------------------------------------------------");

    // Execute the query
    await db.query(query, flatValues);

    console.log("Translations saved successfully in PostgreSQL!");
  } catch (error) {
    console.error("Error saving translations to DB:", error.message);
    throw new Error("Failed to save translations to the database");
  }
}

// ===========================================================================================

const translationEdit = async (req, res) => {
  console.log("You reached translationEdit");

  const { key, newTranslation, originalLanguageCode, translatedLanguageCode } =
    req.body;

  if (
    !key ||
    !newTranslation ||
    !originalLanguageCode ||
    !translatedLanguageCode
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (
    typeof key !== "string" ||
    typeof newTranslation !== "string" ||
    typeof originalLanguageCode !== "string" ||
    typeof translatedLanguageCode !== "string"
  ) {
    return res.status(400).json({ error: "Invalid input format" });
  }

  try {
    // PostgreSQL Update Query
    const query = `
      UPDATE translations
      SET translated_value = $1,
          translated_by = 'USER',
          translated_at = CURRENT_TIMESTAMP
      WHERE Original_data_keys = $2
        AND Original_Data_Language_Code = $3
        AND translated_language_code = $4
    `;

    // Execute the query with parameterized inputs
    const result = await db.query(query, [
      newTranslation, // $1 -> new translated value
      key, // $2 -> key
      originalLanguageCode, // $3 -> original language code
      translatedLanguageCode, // $4 -> translated language code
    ]);

    // Check if the translation was actually updated
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Translation not found" });
    }

    res.status(200).json({ message: "Translation updated successfully!" });
  } catch (error) {
    console.error("❌ Error updating translation:", error);
    res.status(500).json({ error: "Failed to update translation" });
  }
};


// =========================================================================

const translateAddedKey = async (req, res) => {
  console.log("reached translateAddedKey function in backend")
  const { key, value, languages } = req.body;

  if (!key || !value || !languages || !Array.isArray(languages)) {
    return res.status(400).json({ error: "Invalid request data" });
  }

  try {
    console.log(`🔹 Translating '${value}' for languages:`, languages);

    // Step 1: Get translations from Gemini
    const translations = await AddedKeyGeminiTranslation(key ,value, languages);

    console.log("✅ Gemini Translations:", translations);

    // Step 2: Save translations to DB
    await saveAddedKeyTranslationsToDB(translations , "en");

    // Step 3: Send response back to frontend
    res.status(200).json({ translations });
  } catch (error) {
    console.error("❌ Error in translateAddedKey:", error);
    res.status(500).json({ error: "Failed to translate and save added key" });
  }
};


const AddedKeyGeminiTranslation = async (key, value, languages) => {
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);


  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


  const prompt = `
Translate the following English text into these languages: ${languages}.
Format the output as a JSON object with keys in the format {LanguageCode: Translation}.
For example: {"Russian_ru": "Доброе утро", "German_de": "Guten Morgen"}.

Follow these strict rules:

2) Preserve placeholders like "{}" exactly as they are in the translated text.
3) Translate the text inside HTML tags (like "<b>text</b>") while keeping the HTML structure intact.
4) Return only a **valid JSON** object.
5) **Return the JSON response without markdown, backticks, or any extra formatting.**
6) If you need more time to process for translation, take more time. Ensure that **You give translations for all languages** and none are left out.
8) **If translation is unclear, do your best to provide the best possible answer. Do not leave translations empty.**
9) **If the value has a full stop (.) Then put that full stop in the translation also, without forgetting** 

Text: "${value}"
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    console.log("Gemini Response:", text);


    const rawTranslations = JSON.parse(text);

    const formattedTranslations = {};

    for (const [lang, translation] of Object.entries(rawTranslations)) {
      const langCode = lang.split("_").pop(); // Extract "ru" from "Russian_ru"

      formattedTranslations[lang] = {
        key,
        value,
        translation,
        translated_language_code: langCode,
      };
    }
    return formattedTranslations;
  } catch (error) {
    console.error("Error during Gemini translation:", error);
    throw new Error("Failed to translate using Gemini");
  }
};


const saveAddedKeyTranslationsToDB = async (
  translations,
  originalDataLanguageCode
) => {
  // PostgreSQL Insert with ON CONFLICT (UPSERT)
  const query = `
    INSERT INTO translations 
    (Original_data_keys, Original_data_value, Original_Data_Language_Code, translated_value, translated_language_code, translated_by, translated_at)
    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    ON CONFLICT (Original_data_keys, Original_Data_Language_Code, translated_language_code)
    DO UPDATE SET
      Original_data_value = EXCLUDED.Original_data_value,
      translated_value = EXCLUDED.translated_value,
      translated_language_code = EXCLUDED.translated_language_code,
      translated_by = EXCLUDED.translated_by,
      translated_at = CURRENT_TIMESTAMP;
  `;

  try {
    // Loop through the translations and insert them one by one
    for (const [lang, data] of Object.entries(translations)) {
      const values = [
        data.key, // $1 -> Original_data_keys
        data.value, // $2 -> Original_data_value
        originalDataLanguageCode, // $3 -> Original_Data_Language_Code
        data.translation, // $4 -> Translated value
        data.translated_language_code, // $5 -> Translated language code
        "AI", // $6 -> Translated by
      ];

      console.log("------------------------------------------------------");
      console.log("Inserting values into DB:", values);
      console.log("------------------------------------------------------");

      await db.query(query, values);
    }

    console.log("Added translations saved successfully.");
  } catch (error) {
    console.error("Error saving translations to DB:", error.message);
    throw new Error("Failed to save translations to the database");
  }
};


module.exports = {
  translateKeys,
  translationEdit,
  translateAddedKey,
};