import React from "react";
import Search from "react-feather/dist/icons/search";

interface IFilterComponents {
  onChange: (pattern: string) => void;
  value: string;
}

const FilterComponents = ({ onChange, value }: IFilterComponents) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
