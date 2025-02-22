const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../config/db");

// Predefined translation handler
const translateKeys = async (req, res) => {
  console.log("you reached here");

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
    const valuesArray = parsedData.map((item) => item.value);

    console.log("values Array", valuesArray);

    // Translate only the values using Gemini API
    const translations = await getGeminiTranslations(
      parsedData,
      valuesArray,
      selectedlanguageCode,
      selectedlanguageName
    );

    console.log(
      "translations got from gemini function. Now will send this to frontend",
      translations
    );

    // Save translations to the database
    await saveTranslationsToDB(
      translations, 
      originalDataLanguageCode,
      selectedlanguageCode
    );

    // Send translated data back in the response
    res.status(200).json(translations);
  } catch (error) {
    console.error("Error translating values:", error);
    res.status(500).json({ error: "Failed to translate values" });
  }
};



// Function to get translations from Gemini API
async function getGeminiTranslations(parsedData, valuesArray, languageCode, languageName) {
  const translations = [];

  // Initialize the API with your key
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);

  // Specify the model
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Construct the translation prompt for Gemini API
  const prompt = `
  You are a translation assistant. Translate the following **values** into the language whose language code is ${languageCode} and language name is ${languageName}. 

  Follow these strict rules:

1) Translate the **values** from the valuesArray.
2) Preserve placeholders like "{}" exactly as they are in the translated text.
3) Translate the text inside HTML tags (like "<b>text</b>") while keeping the HTML structure intact.
4) Return only a **valid JSON** object where **values are translated** while keeping keys unchanged.
5) **Return the JSON response without markdown, backticks, or any extra formatting.**
6) If you need more time to process each value for translation, take more time. Ensure that **all values are translated** and none are left out.
7) Ensure that every value is translated.
8) **If translation is unclear, do your best to provide the best possible answer. Do not leave translations empty.**
9) **If the key has a full stop (.) Then put that full stop in the translation also, without forgetting** 

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
    // Generate the response from Gemini
    const result = await model.generateContent(prompt);

    // Extract and clean up the translated response
    const translatedText = result.response.text().trim();
    const parsedTranslations = JSON.parse(translatedText);

    // Process each item in parsedData and match translations


    // const parsedTranslations = {
    //   OK: "ठीक है",
    //   Next: "अगला",
    // };
    console.log(
      "this is the valuesArray stringified version which we sent to gemini", JSON.stringify(valuesArray) );
    console.log("this is taza data from gemini", parsedTranslations);

    for (const item of parsedData) {
      const translatedValue =
        parsedTranslations[item.value] || "Error fetching translation";

      translations.push({
        key: item.key,
        value: item.value,
        translation: translatedValue,
      });
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);

    // Handle API failure by setting a default error message
    for (const item of parsedData) {
      translations.push({
        key: item.key,
        value: item.value,
        translation: "Error fetching translation",
      });
    }
  }

  return translations;
  // [
  //   { key: "ok", value: "OK", translation: "ठीक है" },
  //   { key: "next", value: "Next", translation: "अगला" },
  //   { key: "allow", value: "Allow", translation: "Error fetching translation" },
  // ];
}


// Function to save translations to the database
async function saveTranslationsToDB(
  translations,
  originalDataLanguageCode,
  translatedLanguageCode
) {
  const query = `
    INSERT INTO translations 
    (Original_data_keys, Original_data_value, Original_Data_Language_Code, translated_value, translated_language_code, translated_by)
    VALUES ?
    ON DUPLICATE KEY UPDATE
    translated_value = VALUES(translated_value),
    translated_language_code = VALUES(translated_language_code),
    translated_by = VALUES(translated_by),
    translated_at = CURRENT_TIMESTAMP
  `;

  const values = translations.map(({ key, value, translation }) => [
    key, // Original_data_keys
    value, // Original_data_value (original value)
    originalDataLanguageCode, // Original_Data_Language_Code
    translation, // translated_value
    translatedLanguageCode, // translated_language_code
    "AI", // translated_by (AI as default)
  ]);

  console.log("------------------------------------------------------");
  console.log("this is the values array, which we'll insert in database", values);
  console.log("------------------------------------------------------");
  try {
    await db.query(query, [values]);
  } catch (error) {
    console.error("Error saving translations to DB:", error.message);
    throw new Error("Failed to save translations to the database");
  }
}




// ===========================================================================================

const translationEdit = async (req, res) => {

  console.log("You reached translationEdit");
  const {
    key,
    newTranslation,
    originalLanguageCode,
    translatedLanguageCode,
  } = req.body;

  // Validate input
  if (
    !key ||
    !newTranslation ||
    !originalLanguageCode ||
    !translatedLanguageCode
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Validate input formats
  if (
    typeof key !== "string" ||
    typeof newTranslation !== "string" ||
    typeof originalLanguageCode !== "string" ||
    typeof translatedLanguageCode !== "string"
  ) {
    return res.status(400).json({ error: "Invalid input format" });
  }

  try {
    // Update the translation in the database
    const query = `
      UPDATE Translations 
      SET translated_value = ?, translated_by = 'USER', translated_at = CURRENT_TIMESTAMP
      WHERE Original_data_keys = ? 
      AND Original_Data_Language_Code = ? 
      AND translated_language_code = ?
    `;

    // Execute the query with parameterized inputs to prevent SQL injection
    const [result] = await db.query(query, [
      newTranslation,
      key,
      originalLanguageCode,
      translatedLanguageCode,
    ]);

    // Check if the translation was actually updated
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Translation not found" });
    }

    // Send success response
    res.status(200).json({ message: "Translation updated successfully!" });
  } catch (error) {
    console.error("Error updating translation:", error);
    res.status(500).json({ error: "Failed to update translation" });
  }
};




module.exports = {
  translateKeys,
  translationEdit,
};