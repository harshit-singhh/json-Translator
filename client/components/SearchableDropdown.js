import React from "react";
import Select from "react-select";
import languages from "../data/languages";
const SearchableDropdown = ({ selectedOption, setSelectedOption }) => {
  // Map languages array to the format required by react-select
  const options = languages.map((lang) => ({
    value: lang.code, // Using 'code' as the value
    label: lang.name, // Using 'name' as the label
  }));

  // Handle selection change
  const handleChange = (selected) => {
    setSelectedOption(selected); // Update the parent component's state
  };

  return (
    <div className="w-60">
      <Select
        options={options}
        value={selectedOption}
        onChange={handleChange}
      />
      {/* For example, if the user selects "English", selectedOption might look like:
      { value: 'en', label: 'English' } */}

    </div>
  );


};

export default SearchableDropdown;
