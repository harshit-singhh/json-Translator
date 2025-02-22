"use client";

import { useEffect, useState } from "react";
import DynamicTable from "@/components/DynamicTable";
import SearchableDropdown from "@/components/SearchableDropdown";
import languages from "@data/languages";

export default function HomePage() {
  const [file, setFile] = useState(null);
  const [isFileSelected, setIsFileSelected] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [uploadMessage, setUploadMessage] = useState("");
  const [languageName, setLanguageName] = useState("");
  const [translations, setTranslations] = useState({}); // Store translations for each language
  const [selectedOption, setSelectedOption] = useState(null);
  const [originalDataLanguageCode, setOriginalDataLanguageCode] = useState("");
  const [currentlySelectedLanguageName, setCurrentlySelectedLanguageName] =
    useState("");
  const [currentlySelectedLanguageCode, setCurrentlySelectedLanguageCode] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Loading state for button

  useEffect(() => {
    console.log("translations state", translations);
  }, [JSON.stringify(translations)]); // ✅ Correct

  // Handle file selection
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsFileSelected(true);
    }
  };

  // Function to recursively flatten the JSON object
  const flattenObject = (obj, prefix = "") => {
    let result = [];

    for (let [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === "object" && value !== null) {
        result = result.concat(flattenObject(value, newKey));
      } else {
        result.push({ key: newKey, value });
      }
    }

    return result;

    // This is how the result array would look
    // [
    //   { key: "ok", value: "OK" },
    //   { key: "next", value: "Next" },
    //   { key: "nested.allow", value: "Allow" },
    //   { key: "nested.apply", value: "Apply" },
    //   { key: "nested.deeper.error", value: "Error" },
    // ];
  };

  // Handle language upload
  const handleUploadLanguage = async (
    selectedlanguageCode,
    selectedlanguageName,
    originalDataLanguageCode
  ) => {
    setCurrentlySelectedLanguageName(selectedlanguageName);
    setCurrentlySelectedLanguageCode(selectedlanguageCode);
    try {
      setIsLoading(true); // Start loader
      

      const response = await fetch("http://localhost:5000/api/translations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedlanguageCode,
          selectedlanguageName,
          parsedData, // Sending the entire parsedData instead of just keys
          originalDataLanguageCode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to upload language");
      }

      const result = await response.json();
      // console.log("backend result after converting to object", result);
      const translationArray = result;

      // console.log(
      //   "this is translations array came from backend",
      //   translationArray
      // );

      console.log("Currently selected language code", selectedlanguageCode);

      // Update translations state for the new language
      setTranslations((prevTranslations) => ({
        ...prevTranslations,
        [`${selectedlanguageName}_${selectedlanguageCode}`]: translationArray, // Store as "French_fr"
      }));

      console.log(
        "successfully added the backend response in translations array"
      );

      setUploadMessage("Language uploaded and translations updated!");
    } catch (error) {
      console.error("Error uploading language:", error);
      setUploadMessage("Error adding language!");
    } finally {
      setIsLoading(false); // Stop loader
    }
  };

  // Handle file parsing
  const handleUpload = async () => {
    if (!file) {
      setUploadMessage("Please select a file to upload!");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target.result;

        try {
          const jsonData = JSON.parse(text);

          // Flatten the JSON data
          const extractedData = flattenObject(jsonData);

          // Set the parsed data
          setParsedData(extractedData);

          // Extract language code from the filename (e.g., 'en.json' -> 'en')
          const languageCode = file.name.split(".")[0];
          setOriginalDataLanguageCode(languageCode);

          // Send extracted data and language code to the backend
          const response = await fetch(
            "http://localhost:5000/api/uploads/upload",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                languageCode, // Language code
                extractedData, // Flattened keys and values
              }),
            }
          );

          if (!response.ok) {
            throw new Error("Failed to upload data");
          }

          const result = await response.json();
          setLanguageName(result.metadata.languageName); // Set the language name from backend
          setUploadMessage("File parsed and uploaded successfully!");
        } catch (error) {
          console.error("Error parsing JSON:", error);
          setUploadMessage("Error parsing file!");
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error("Error reading file:", error);
      setUploadMessage("Error reading file!");
    }
  };


  const updateTranslation = async (
    key,
    originalLangCode,
    translatedLangCode,
    newTranslation
  ) => {
    try {

        const requestData = {
          key,
          newTranslation,
          originalLanguageCode: originalLangCode,
          translatedLanguageCode: translatedLangCode,
        };

        console.log("Sending update request with data:", requestData);


      const response = await fetch(
        `http://localhost:5000/api/translations/edit`,
        {
          // Remove key from URL
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key, // Include key in body
            newTranslation,
            originalLanguageCode: originalLangCode,
            translatedLanguageCode: translatedLangCode,
          }),
        }
      );

      console.log("came back after saving edited translation to db");

      if (!response.ok) {
        throw new Error("Failed to update translation");
      }

      const result = await response.json();
      console.log(result.message); // Debugging message
    } catch (error) {
      console.error("Error updating translation:", error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      {/* Title */}
      <h1 className="text-5xl font-bold text-center text-gray-800 mb-8">
        Translation Dashboard
      </h1>

      {/* File Upload Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
        <input
          type="file"
          onChange={handleFileChange}
          id="file-upload"
          className="hidden"
        />
        <label
          htmlFor="file-upload"
          className={`cursor-pointer px-6 py-3 ${
            isFileSelected ? "bg-green-500" : "bg-red-500"
          } text-white text-center text-lg font-semibold rounded-lg w-40 ${
            isFileSelected ? "hover:bg-green-600" : "hover:bg-red-600"
          }`}
        >
          {isFileSelected ? "File Selected" : "Select File"}
        </label>
        <button
          onClick={handleUpload}
          className="px-6 py-3 bg-red-500 text-white text-center w-40 text-lg font-semibold rounded-lg hover:bg-red-600"
        >
          Upload File
        </button>
      </div>

      {/* Upload Message */}
      {uploadMessage && <p className="text-gray-700 mb-6">{uploadMessage}</p>}

      {/* Searchable Dropdown and Add Language Button */}
      {parsedData.length > 0 && languageName && (
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <SearchableDropdown
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
          />
          <button
            onClick={() =>
              handleUploadLanguage(
                selectedOption.value,
                selectedOption.label,
                originalDataLanguageCode
              )
            }
            disabled={!selectedOption || isLoading}
            className={`px-6 py-3 bg-green-500 text-white text-lg font-semibold rounded-lg flex items-center justify-center ${
              !selectedOption || isLoading
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-green-600"
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Add Language"
            )}
          </button>
        </div>
      )}

      {/* Dynamic Table */}
      {parsedData.length > 0 && (
        <DynamicTable
          parsedData={parsedData}
          translations={translations}
          setTranslations={setTranslations}
          languageName={languageName}
          updateTranslation={updateTranslation}
          originalDataLanguageCode={originalDataLanguageCode}
        />
      )}
    </div>
  );
}
