import React from "react";

import ToggleUnmounted from "react-feather/dist/icons/eye-off";
import ToggleGrouping from "react-feather/dist/icons/code";

import FilterComponents from "../form/FilterComponents";
import ButtonToggle from "../ui/ButtonToggle";

const ToolsHeader = ({
  setSearched,
  searched,
  groupByParent,
  onGroupingChange,
  onShowUnmounted,
  showUnmounted,
}) => {
  return (
    <div className="tools-header">
      <div>
        <FilterComponents onChange={setSearched} value={searched} />
        <ButtonToggle
          Icon={ToggleGrouping}
          isActive={groupByParent}
          onChange={onGroupingChange}
          tooltip={"Toggle components grouping by parent or owner"}
        />
        <ButtonToggle
          Icon={ToggleUnmounted}
          isActive={showUnmounted}
          onChange={onShowUnmounted}
          tooltip={"Toggle unmounted components visibility"}
        />
      </div>
    </div>
  );
};

export default ToolsHeader;
