import * as React from "react";

import {
  ToggleGrouping,
  ToggleUnmounted,
  ClearEventLog,
} from "../common/icons";

import ComponentFilter from "./ComponentFilter";
import ButtonToggle from "../common/ButtonToggle";
import { useEventsContext } from "../../utils/events";

type BolleanToggle = (fn: (state: boolean) => boolean) => void;
interface ToolbarProps {
  onFilterPatternChange: (pattern: string) => void;
  filterPattern: string;
  groupByParent: boolean;
  onGroupingChange: BolleanToggle;
  onShowUnmounted: BolleanToggle;
  showUnmounted: boolean;
}

const Toolbar = ({
  onFilterPatternChange,
  filterPattern,
  groupByParent,
  onGroupingChange,
  onShowUnmounted,
  showUnmounted,
}: ToolbarProps) => {
  const { clearAllEvents } = useEventsContext();

  return (
    <div className="toolbar">
      <ComponentFilter onChange={onFilterPatternChange} value={filterPattern} />
      <ButtonToggle
        icon={ToggleGrouping}
        isActive={groupByParent}
        onChange={onGroupingChange}
        tooltip={"Toggle components grouping by parent or owner"}
      />
      <ButtonToggle
        icon={ToggleUnmounted}
        isActive={showUnmounted}
        onChange={onShowUnmounted}
        tooltip={"Toggle unmounted components visibility"}
      />
      <ButtonToggle
        icon={ClearEventLog}
        isActive={false}
        onChange={clearAllEvents}
        tooltip={"Clear event log"}
      />
    </div>
  );
};

const ToolbarMemo = React.memo(Toolbar);
ToolbarMemo.displayName = "Toolbar";

export default ToolbarMemo;
