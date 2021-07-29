import React from "react";

import { Code } from "react-feather";

import FilterComponents from "../form/FilterComponents";
import ButtonToggle from "../ui/ButtonToggle";

const ToolsHeader = ({ setSearched, searched, onShowDisabled, showDisabled }) => {
  return (
    <div className="tools-header">
      <div>
        <FilterComponents onChange={setSearched} value={searched} />
        <ButtonToggle Icon={Code} isActive={showDisabled} onChange={onShowDisabled} tooltip="Toggle unmounted elements" />
      </div>
    </div>
  );
};

export default ToolsHeader;
