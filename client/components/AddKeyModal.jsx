import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaSpinner } from "react-icons/fa"; // Import loader

const AddKeyModal = ({
  setIsModalOpen,
  parsedData,
  setParsedData,
  geminiTranslations,
  setGeminiTranslations,
}) => {
  const [newKey, setNewKey] = useState("");
  const [translations, setLocalTranslations] = useState({});
  const initialLanguages = Object.keys(parsedData);
  const [showCloseIcon, setShowCloseIcon] = useState(false); // Control cross button visibility
  const modalBodyRef = useRef(null);
  const [loading, setLoading] = useState(false);

  // Initialize translations with empty values for all initial languages
  const handleKeyChange = (e) => {
    const key = e.target.value;
    setNewKey(key);

    if (key.trim()) {
      const newTranslations = {};
      initialLanguages.forEach((lang) => {
        newTranslations[lang] = ""; // Empty value initially
      });
      setLocalTranslations(newTranslations);
    }
  };

  const handleTranslationChange = (lang, value) => {
    setLocalTranslations((prev) => ({
      ...prev,
      [lang]: value,
    }));
  };

  const handleSave = async () => {
    if (!newKey.trim()) {
      alert("Please enter a key.");
      return;
    }

    setLoading(true);

    const updatedData = { ...parsedData };

    // Prepare the payload for saving initial language translations
    const newKeyTranslations = {};

    initialLanguages.forEach((lang) => {
      if (!updatedData[lang]) {
        updatedData[lang] = {}; // Ensure language exists
      }
      updatedData[lang][newKey] = translations[lang] || "Not translated";

      // Prepare backend payload for initial languages
      const langCode = lang.split("_").pop(); // Extract "en" from "English_en"
      newKeyTranslations[langCode] = translations[lang] || "Not translated";
    });

    try {
      // ✅ Send initial languages to backend
      const saveResponse = await fetch(
        "http://localhost:5000/api/uploads/addKey",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: newKey,
            translations: newKeyTranslations,
          }),
        }
      );

      if (saveResponse.ok) {
        console.log(
          "Key and initial language translations saved successfully."
        );

        // ✅ After successful save, update the table by calling setParsedData
        setParsedData(updatedData);

        await handleGeminiTranslation(
          newKey,
          translations[initialLanguages[0]]
        );
      } else {
        console.error("Failed to save initial language translations.");
      }
    } catch (error) {
      console.error("Error saving initial languages:", error);

      // ✅ Call Gemini translation function after saving initial languages
    }

    // ✅ Close the modal
    setLoading(false);
    setIsModalOpen(false);
  };

  const handleGeminiTranslation = async (key, englishValue) => {
    if (!key || !englishValue) {
      console.error("Invalid key or value for Gemini translation.");
      return;
    }

    const addedLanguages = Object.keys(geminiTranslations); // Extract added languages
    const geminiPayload = {
      key: key,
      value: englishValue, // English value as source for translation
      languages: addedLanguages, // Send only added languages
    };

    console.log("Sending Gemini request with payload:", geminiPayload);

    const updatedData = { ...parsedData };

    try {
      const result = await fetch(
        "http://localhost:5000/api/translations/translateAddedKey",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(geminiPayload),
        }
      );

      if (result.ok) {
        const Response = await result.json();
        const geminiResponse = Response.translations;
        console.log("✅ Received Gemini translations:", geminiResponse);

        // ✅ Traverse Gemini translations and update the translations object
        for (const [lang, translationObj] of Object.entries(geminiResponse)) {
          if (!geminiTranslations[lang]) {
            geminiTranslations[lang] = [];
          }

          // 🔥 Find the existing key if it exists
          const existingIndex = geminiTranslations[lang].findIndex(
            (item) => item.key === key
          );

          if (existingIndex !== -1) {
            // ✅ Key exists → Replace old value + old translation
            geminiTranslations[lang][existingIndex] = {
              key,
              value: translationObj.value, // New value
              translation: translationObj.translation, // New translation
            };
          } else {
            // ✅ Key doesn't exist → Push new translation
            geminiTranslations[lang].push({
              key,
              value: translationObj.value,
              translation: translationObj.translation,
            });
          }
        }

        setGeminiTranslations({ ...geminiTranslations });

        // console.log("✅ Updated translations object:", translations);
      } else {
        console.error("❌ Failed to fetch Gemini translations.");
      }
    } catch (error) {
      console.error("❌ Error fetching Gemini translations:", error);
    }
  };

  // Check if modal content is scrollable
  useEffect(() => {
    if (modalBodyRef.current) {
      setShowCloseIcon(
        modalBodyRef.current.scrollHeight > modalBodyRef.current.clientHeight
      );
    }
  }, [translations, newKey]);

  return (
    <div className="modal show d-block" tabIndex="-1" role="dialog">
      <div
        className="modal-dialog modal-dialog-centered modal-lg"
        role="document"
      >
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header">
            <h5 className="modal-title">Add New Key</h5>
          </div>

          {/* Modal Body */}
          <div
            className="modal-body overflow-auto"
            ref={modalBodyRef}
            style={{ maxHeight: "300px" }}
          >
            {/* Key Input */}
            <div className="form-group">
              <label style={{ marginBottom: "8px", display: "block" }}>
                Key Name:
              </label>
              <input
                type="text"
                className="form-control"
                value={newKey}
                onChange={handleKeyChange}
                placeholder="Enter key name"
                style={{
                  outline: "none",
                  border: "1px solid #ced4da",
                  boxShadow: "0 0 3px rgba(0, 123, 255, 0.5)", // Slimmer blue border
                }}
              />
            </div>

            {/* Translation Inputs */}
            {initialLanguages.map((lang) => (
              <div key={lang} className="form-group mt-4">
                <label style={{ marginBottom: "8px", display: "block" }}>
                  {lang} Translation:
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={translations[lang] || ""}
                  onChange={(e) =>
                    handleTranslationChange(lang, e.target.value)
                  }
                  placeholder={`Enter ${lang} translation`}
                  style={{
                    outline: "none",
                    border: "1px solid #ced4da",
                    boxShadow: "0 0 3px rgba(0, 123, 255, 0.5)", // Slimmer blue border
                  }}
                />
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              style={{ width: "120px", height: "40px" }}
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center justify-content-center"
              onClick={handleSave}
              style={{ width: "120px", height: "40px" }}
              disabled={loading} // Disable button while loading
            >
              {loading ? (
                <>
                  <FaSpinner className="spin-icon" />
                </>
              ) : (
                "Save Key"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddKeyModal;
