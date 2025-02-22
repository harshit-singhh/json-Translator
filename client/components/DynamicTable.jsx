import React, { useMemo, useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { FaPen, FaSave, FaDownload } from "react-icons/fa"; // Added download icon

const DynamicTable = ({
  parsedData,
  translations,
  setTranslations,
  languageName,
  updateTranslation,
  originalDataLanguageCode,
}) => {
  const [editingCell, setEditingCell] = useState({
    rowId: null,
    columnId: null,
  });
  const [editedTranslation, setEditedTranslation] = useState("");

  const addedLanguages = useMemo(
    () => Object.keys(translations),
    [translations]
  );

  useEffect(() => {
    console.log("Languages Array", addedLanguages);
  }, [JSON.stringify(addedLanguages)]);

  const columns = useMemo(() => {
    const baseColumns = [
      { header: "Key", accessorKey: "key" },
      { header: `${languageName} Translation`, accessorKey: "value" },
    ];

    addedLanguages.forEach((lang) => {
      const [langName, langCode] = lang.split("_");
      baseColumns.push({
        header: (
          <div className="flex items-center justify-between w-full">
            <span className="flex-grow text-center">{`${langName} Translation`}</span>
            <FaDownload
              className="text-gray-500 cursor-pointer ml-2"
              onClick={() => handleDownload(`${langName}_${langCode}`)}
            />
          </div>
        ),
        accessorKey: `${langName}_${langCode}`,
      });
    });

    return baseColumns;
  }, [languageName, addedLanguages]);

  const data = useMemo(() => {
    return parsedData.map((item) => {
      const row = { key: item.key, value: item.value };

      addedLanguages.forEach((lang) => {
        const [langName, langCode] = lang.split("_");
        const translation = translations[lang]?.find((t) => t.key === item.key);
        row[`${langName}_${langCode}`] = translation
          ? translation.translation
          : "Not found";
      });

      return row;
    });
  }, [parsedData, translations, addedLanguages]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleDownload = (languageKey) => {
    const flatJson = translations[languageKey]; // Get the flat JSON from translations state

    if (!flatJson) {
      console.error("No data found for language:", languageKey);
      return;
    }

    const nestedJson = convertToNestedObject(
      Object.fromEntries(
        flatJson.map(({ key, translation }) => [key, translation])
      )
    );

    const blob = new Blob([JSON.stringify(nestedJson, null, 2)], {
      type: "application/json",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${languageKey}_Translation.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const convertToNestedObject = (flatObject) => {
    const nestedObject = {};

    Object.keys(flatObject).forEach((key) => {
      const value = flatObject[key];
      const keys = key.split("."); // Split keys by dot notation
      let current = nestedObject;

      for (let i = 0; i < keys.length; i++) {
        const part = keys[i];

        if (i === keys.length - 1) {
          // Assign value when reaching the last key
          current[part] = value;
        } else {
          // Create nested objects if they don't exist
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
      }
    });

    return nestedObject;
  };



  const handleEditClick = (rowId, columnId, currentValue) => {
    setEditingCell({ rowId, columnId });
    setEditedTranslation(currentValue);
  };

  const handleSaveClick = (row) => {
    const key = row.original.key;
    const originalLangCode = originalDataLanguageCode;
    const translatedLangCode = editingCell.columnId.split("_")[1];
    const translatedLangName = editingCell.columnId.split("_")[0];

    updateTranslation(
      key,
      originalLangCode,
      translatedLangCode,
      editedTranslation
    )
      .then(() => {
        setTranslations((prevTranslations) => ({
          ...prevTranslations,
          [`${translatedLangName}_${translatedLangCode}`]: prevTranslations[
            `${translatedLangName}_${translatedLangCode}`
          ].map((t) => ({
            ...t,
            translation: t.key === key ? editedTranslation : t.translation,
          })),
        }));

        setEditingCell({ rowId: null, columnId: null });
        setEditedTranslation("");
      })
      .catch((error) => console.error("Error updating translation:", error));
  };

  return (
    <table className="border border-gray-300 w-full table-fixed">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header, index) => (
              <th
                key={header.id}
                className={`border-b border-gray-300 p-2 ${
                  index !== headerGroup.headers.length - 1 ? "border-r" : ""
                }`}
              >
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id} className="border-b border-gray-300">
            {row.getVisibleCells().map((cell) => {
              const columnKey = cell.column.id;
              const currentTranslation = cell.getValue();

              return (
                <td
                  key={`${row.id}_${columnKey}`}
                  className="border-r border-gray-300 p-2 relative group"
                >
                  {editingCell.rowId === row.id &&
                  editingCell.columnId === columnKey ? (
                    <div className="flex items-center space-x-2 w-full">
                      <textarea
                        value={editedTranslation}
                        onChange={(e) => setEditedTranslation(e.target.value)}
                        className="border p-1 w-full resize-none overflow-y-auto"
                        style={{
                          minHeight: "40px",
                          maxHeight: "200px",
                        }}
                      />
                      <FaSave
                        onClick={() => handleSaveClick(row)}
                        className="text-green-500 cursor-pointer ml-2 self-center"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span>{currentTranslation}</span>
                      {addedLanguages.some((lang) => columnKey === lang) && (
                        <FaPen
                          onClick={() =>
                            handleEditClick(
                              row.id,
                              columnKey,
                              currentTranslation
                            )
                          }
                          className="text-blue-500 cursor-pointer text-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        />
                      )}
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DynamicTable;



// const handleDownload = (language) => {
//   if (!translations[language]) {
//     console.error(`No translations found for ${language}`);
//     return;
//   }

//   const jsonData = JSON.stringify(
//     translations[language].reduce((acc, { key, translation }) => {
//       acc[key] = translation;
//       return acc;
//     }, {}),
//     null,
//     2
//   );

//   const blob = new Blob([jsonData], { type: "application/json" });
//   const link = document.createElement("a");
//   link.href = URL.createObjectURL(blob);
//   link.download = `${language}_Translation.json`;
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);
// };