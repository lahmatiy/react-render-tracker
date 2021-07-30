import React from "react";

import Code from "react-feather/dist/icons/code";
import Search from "react-feather/dist/icons/search";

import FilterComponents from "../form/FilterComponents";
import ButtonToggle from "../ui/ButtonToggle";

const ToolsHeader = ({
  setSearched,
  searched,
  onShowDisabled,
  showDisabled,
  showChildChanges,
  onShowChildChanges,
}) => {
  return (
    <div className="tools-header">
      <div>
        <FilterComponents onChange={setSearched} value={searched} />
        <ButtonToggle
          Icon={Code}
          isActive={showDisabled}
          onChange={onShowDisabled}
          tooltip="Toggle unmounted elements"
        />
        <ButtonToggle
          Icon={Search}
          isActive={showChildChanges}
          onChange={onShowChildChanges}
          tooltip="Show child changes"
        />
      </div>
    </div>
  );
};

export default ToolsHeader;
