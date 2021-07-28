import React from "react";
import Search from "react-feather/dist/icons/search";

const FilterComponents = ({ onChange, value }) => {
  const handleChange = e => {
    onChange(e.target.value);
  };

  return (
    <div className="search-components">
      <Search />
      <input
        type="text"
        placeholder="Filter components"
        onChange={handleChange}
        value={value}
      />
    </div>
  );
};

export default FilterComponents;
