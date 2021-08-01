import React from "react";

import ToggleUnmounted from "react-feather/dist/icons/eye-off";
import ToggleGrouping from "react-feather/dist/icons/code";

import FilterComponents from "../form/FilterComponents";
import ButtonToggle from "../ui/ButtonToggle";

type BolleanToggle = (fn: (state: boolean) => boolean) => void;
interface IToolsHeader {
  onFilterPatternChange: (pattern: string) => void;
  filterPattern: string;
  groupByParent: boolean;
  onGroupingChange: BolleanToggle;
  onShowUnmounted: BolleanToggle;
  showUnmounted: boolean;
}

const ToolsHeader = ({
  onFilterPatternChange,
  filterPattern,
  groupByParent,
  onGroupingChange,
  onShowUnmounted,
  showUnmounted,
}: IToolsHeader) => {
  return (
    <div className="tools-header">
      <div>
        <FilterComponents
          onChange={onFilterPatternChange}
          value={filterPattern}
        />
        <ButtonToggle
          icon={<ToggleGrouping />}
          isActive={groupByParent}
          onChange={onGroupingChange}
          tooltip={"Toggle components grouping by parent or owner"}
        />
        <ButtonToggle
          icon={<ToggleUnmounted />}
          isActive={showUnmounted}
          onChange={onShowUnmounted}
          tooltip={"Toggle unmounted components visibility"}
        />
      </div>
    </div>
  );
};

export default ToolsHeader;
