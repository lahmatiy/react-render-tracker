import React from "react";
import { Search } from "../common/icons";

interface ComponentFilterProps {
  onChange: (pattern: string) => void;
  value: string;
}

const ComponentFilter = ({ onChange, value }: ComponentFilterProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="component-filter">
      {Search}
      <input
        type="text"
        placeholder="Find component"
        onChange={handleChange}
        value={value}
      />
    </div>
  );
};

export default ComponentFilter;
