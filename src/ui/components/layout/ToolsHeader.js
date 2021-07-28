import React from "react";

import FilterComponents from "../form/FilterComponents";
import ElementName from "../element/ElementName";

const ToolsHeader = ({ setSearched, searched, selected }) => {
  return (
    <div className="tools-header">
      <div>
        <FilterComponents onChange={setSearched} value={searched} />
      </div>
      {selected && (
        <div>
          <ElementName data={selected} />
        </div>
      )}
    </div>
  );
};

export default ToolsHeader;
