import React from "react";

import FilterComponents from "../form/FilterComponents";

const ToolsHeader = ({ setSearched, searched }) => {
  return (
    <div className="tools-header">
      <FilterComponents onChange={setSearched} value={searched} />
    </div>
  );
};

export default ToolsHeader;
