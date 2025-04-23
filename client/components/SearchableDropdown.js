import React from "react";
import Select from "react-select";
import languages from "../data/languages";
const SearchableDropdown = ({ selectedOption, setSelectedOption }) => {

  const options = languages.map((lang) => ({
    value: lang.code, 
    label: lang.name, 
  }));


  const handleChange = (selected) => {
    setSelectedOption(selected); 
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
