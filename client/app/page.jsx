"use client";

import { useEffect, useState } from "react";
import DynamicTable from "@/components/DynamicTable";
import SearchableDropdown from "@/components/SearchableDropdown";
import languages from "@data/languages";
import AddKeyModal from "@/components/AddKeyModal";


export default function HomePage() {
  const [file, setFile] = useState(null);
  const [isFileSelected, setIsFileSelected] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [uploadMessage, setUploadMessage] = useState("");
  const [languageName, setLanguageName] = useState("");
  const [translations, setTranslations] = useState({}); 
  const [selectedOption, setSelectedOption] = useState(null);
  const [originalDataLanguageCode, setOriginalDataLanguageCode] =
    useState("en");
  const [currentlySelectedLanguageName, setCurrentlySelectedLanguageName] =
    useState("");
  const [currentlySelectedLanguageCode, setCurrentlySelectedLanguageCode] =
    useState("");
  const [isLoading, setIsLoading] = useState(false); 
  const [initialUploadCounter, setInitialUploadCounter] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false); // Control modal visibility

  useEffect(() => {
    console.log("translations state", translations);
  }, [translations]); 

    useEffect(() => {
      console.log("parsed Data", parsedData);
    }, [parsedData]);

  useEffect(() => {
    console.log("initialUploadCounter ", initialUploadCounter);
  }, [initialUploadCounter]);
  useEffect(() => {
    console.log("originalDataLanguageCode", originalDataLanguageCode);
  }, [originalDataLanguageCode]);

  // Handle file selection
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsFileSelected(true);
    }
  };

  const getLanguageName = (code) => {
    const lang = languages.find((l) => l.code === code);
    return lang ? lang.name : code; // Fallback to code if name is not found
  };

  // Function to recursively flatten the JSON object
  const flattenObject = (obj, prefix = "") => {
    let result = {};

    for (let [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === "object" && value !== null) {
        Object.assign(result, flattenObject(value, newKey));
      } else {
        result[newKey] = value;
      }
    }

    return result;

    // Updated output format:
    // {
    //   "ok": "OK",
    //   "next": "Next",
    //   "nested.allow": "Allow",
    //   "nested.apply": "Apply",
    //   "nested.deeper.error": "Error"
    // }
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
          parsedData, // Sending the entire parsedData
          originalDataLanguageCode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to upload language");
      }

      const result = await response.json(); // Receiving the new translationResponse structure

      console.log("Backend response:", result);

      const { BatchTranslationResult, translations } = result; // Destructure the response

      // Update translations state for the new language first
      setTranslations((prevTranslations) => ({
        ...prevTranslations,
        [`${selectedlanguageName}_${selectedlanguageCode}`]: translations, // Store translations in the state
      }));

      console.log(
        "✅ Successfully added backend response to translations state"
      );

      // Display appropriate message based on BatchTranslationResult after updating the table
      if (!BatchTranslationResult) {
        setUploadMessage(
          "⚠️ Couldn't get translations of one or more keys. Please try again."
        );
      } else {
        setUploadMessage("✅ Language uploaded and translations updated!");
      }
    } catch (error) {
      console.error("Error uploading language:", error);
      setUploadMessage("❌ Error adding language!");
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
          const languageCode = file.name.split(".")[0];
          const languageName = getLanguageName(languageCode);
          const languageKey = `${languageName}_${languageCode}`;

          // Check if it's the first upload and ensure it's English
          if (initialUploadCounter === 0 && languageCode !== "en") {
            setUploadMessage("Upload English language first.");
            setIsFileSelected(false);
            return;
          }

          const jsonData = JSON.parse(text);
          const extractedData = flattenObject(jsonData);

          setParsedData((prevData) => {
            const updatedData = { ...prevData };

            if (languageCode === "en") {
              // If English, store all key-value pairs
              updatedData[languageKey] = extractedData;
            } else {
              // Ensure all English keys exist in the new language
              updatedData[languageKey] = Object.fromEntries(
                Object.keys(updatedData["English_en"] || {}).map((key) => [
                  key,
                  extractedData[key] ?? "No Translation Found",
                ])
              );
            }

            return updatedData;
          });

          // This is how parsed data looks like 
          // {
          //   "English_en": {
          //     "ok": "OK",
          //     "next": "Next"
          //   },
          //   "Hindi_hi": {
          //     "ok": "ठीक है"
          //   }
          // }


          setInitialUploadCounter((prev) => prev + 1); // Increase counter after a successful upload

          // Send to backend
          const response = await fetch(
            "http://localhost:5000/api/uploads/upload",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                languageCode,
                extractedData, // Flattened key-value pairs
              }),
            }
          );

          if (!response.ok) {
            throw new Error("Failed to upload data");
          }

          const result = await response.json();
          setLanguageName(result.metadata.languageName);
          setUploadMessage("File parsed and uploaded successfully!");
          setIsFileSelected(false);
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
    <>
      {/* Background Content */}
      <div
        className={`min-h-screen flex flex-col items-center justify-center bg-grey-100 p-6 transition-all duration-80 ${
          isModalOpen ? "blur-sm" : ""
        }`}
      >
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
        {Object.keys(parsedData).length > 0 && languageName && (
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

        {/* Add Key Button */}
        {languageName && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-12 py-3 mb-8 bg-blue-500 text-white text-lg font-semibold rounded-lg hover:bg-blue-600"
          >
            Add Key
          </button>
        )}

        {/* Dynamic Table */}
        {Object.keys(parsedData).length > 0 && (
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

      {/* Add Key Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-slate-400 bg-opacity-30 z-40"
            onClick={() => setIsModalOpen(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative z-50">
            <AddKeyModal
              setIsModalOpen={setIsModalOpen}
              parsedData={parsedData}
              setParsedData={setParsedData}
              geminiTranslations={translations}
              setGeminiTranslations={setTranslations}
            />
          </div>
        </div>
      )}
    </>
  );

}
