import React from "react";

import ToggleUnmounted from "react-feather/dist/icons/eye-off";
import ToggleGrouping from "react-feather/dist/icons/code";
import ClearEventLog from "react-feather/dist/icons/trash";

import ComponentFilter from "./ComponentFilter";
import ButtonToggle from "../common/ButtonToggle";

type BolleanToggle = (fn: (state: boolean) => boolean) => void;
interface ToolbarProps {
  onFilterPatternChange: (pattern: string) => void;
  filterPattern: string;
  groupByParent: boolean;
  onGroupingChange: BolleanToggle;
  onShowUnmounted: BolleanToggle;
  showUnmounted: boolean;
  onClearEventLog: () => void;
}

const Toolbar = ({
  onFilterPatternChange,
  filterPattern,
  groupByParent,
  onGroupingChange,
  onShowUnmounted,
  showUnmounted,
  onClearEventLog,
}: ToolbarProps) => {
  return (
    <div className="toolbar">
      <ComponentFilter onChange={onFilterPatternChange} value={filterPattern} />
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
      <ButtonToggle
        icon={<ClearEventLog />}
        isActive={false}
        onChange={onClearEventLog}
        tooltip={"Clear event log"}
      />
    </div>
  );
};

export default Toolbar;
