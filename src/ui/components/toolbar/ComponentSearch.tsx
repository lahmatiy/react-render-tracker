import * as React from "react";
import { Search } from "../common/icons";

interface ComponentSearchProps {
  onChange: (pattern: string) => void;
  value: string;
}

const ComponentSearch = ({ onChange, value }: ComponentSearchProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="component-search">
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

export default ComponentSearch;
