import * as React from "react";
import ComponentSearch from "./ComponentSearch";
import ButtonToggle from "../common/ButtonToggle";
import { useEventsContext } from "../../utils/events";
import SelectionHistoryNavigation from "./SelectionHistoryNavigation";
import {
  ToggleGrouping,
  ToggleUnmounted,
  ClearEventLog,
  ToggleTimings,
} from "../common/icons";

type BooleanToggle = (fn: (state: boolean) => boolean) => void;
interface ToolbarProps {
  onFilterPatternChange: (pattern: string) => void;
  filterPattern: string;
  onGroupingChange: BooleanToggle;
  groupByParent: boolean;
  onShowUnmounted: BooleanToggle;
  showUnmounted: boolean;
  onShowTimings: BooleanToggle;
  showTimings: boolean;
}

const Toolbar = ({
  onFilterPatternChange,
  filterPattern,
  onGroupingChange,
  groupByParent,
  onShowUnmounted,
  showUnmounted,
  onShowTimings,
  showTimings,
}: ToolbarProps) => {
  const { clearAllEvents } = useEventsContext();

  return (
    <div className="toolbar">
      <SelectionHistoryNavigation />
      <ComponentSearch
        groupByParent={groupByParent}
        showUnmounted={showUnmounted}
        onChange={onFilterPatternChange}
        value={filterPattern}
      />
      <ButtonToggle
        icon={ToggleGrouping}
        isActive={groupByParent}
        onChange={onGroupingChange}
        tooltip={
          groupByParent
            ? "Switch to owner-ownee relationship view in component's tree"
            : "Switch to parent-child relationship view in component's tree"
        }
      />
      <ButtonToggle
        icon={ToggleUnmounted}
        isActive={showUnmounted}
        onChange={onShowUnmounted}
        tooltip={
          showUnmounted
            ? "Hide unmounted components"
            : "Show unmounted components"
        }
      />
      <ButtonToggle
        icon={ToggleTimings}
        isActive={showTimings}
        onChange={onShowTimings}
        tooltip={showTimings ? "Hide timings" : "Show timings"}
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
