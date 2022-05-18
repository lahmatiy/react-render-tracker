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
  Download,
  Pause,
  Play,
} from "../common/icons";
import { useReactRenderers } from "../../utils/react-renderers";

type BooleanToggle = (fn: (state: boolean) => boolean) => void;
interface ToolbarProps {
  onGroupingChange: BooleanToggle;
  groupByParent: boolean;
  onShowUnmounted: BooleanToggle;
  showUnmounted: boolean;
  onShowTimings: BooleanToggle;
  showTimings: boolean;
}

const Toolbar = ({
  onGroupingChange,
  groupByParent,
  onShowUnmounted,
  showUnmounted,
  onShowTimings,
  showTimings,
}: ToolbarProps) => {
  const { selected: selectedReactInstance } = useReactRenderers();
  const { clearAllEvents, allEvents, paused, setPaused } = useEventsContext();
  const downloadAnchorRef = React.useRef<HTMLAnchorElement | null>(null);
  const onDonwload = React.useCallback(() => {
    const anchor = downloadAnchorRef.current;

    if (anchor === null) {
      return;
    }

    const json = JSON.stringify(allEvents);
    const blob = new Blob([json], { type: "octet/stream" });
    const url = window.URL.createObjectURL(blob);

    anchor.href = url;
    anchor.download = `react-render-tracker-data-${new Date()
      .toISOString()
      .replace(/\..+$/, "")
      .replace(/\D/g, "")}.json`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }, [allEvents]);

  React.useEffect(() => {
    let anchor: HTMLAnchorElement | null = document.createElement("a");
    anchor.setAttribute("style", "display:none");
    downloadAnchorRef.current = anchor;
    document.body.appendChild(anchor);

    return () => {
      anchor?.remove();
      downloadAnchorRef.current = anchor = null;
    };
  });

  return (
    <div className="toolbar">
      <div
        className="renderer-info"
        title={
          selectedReactInstance
            ? `${selectedReactInstance?.name} v${selectedReactInstance?.version}`
            : undefined
        }
      >
        <span className="renderer-info__name">
          {selectedReactInstance?.name}
        </span>
        <span className="renderer-info__version">
          <span>{selectedReactInstance?.version}</span>
        </span>
      </div>
      <SelectionHistoryNavigation />
      <ComponentSearch
        groupByParent={groupByParent}
        showUnmounted={showUnmounted}
      />
      <div className="toolbar__buttons">
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

        <span className="toolbar__buttons-splitter" />

        <ButtonToggle
          icon={!paused ? Play : Pause}
          isActive={!paused}
          onChange={() => setPaused(!paused)}
          tooltip={paused ? "Resume event loading" : "Pause event loading"}
        />
        <ButtonToggle
          icon={ClearEventLog}
          isActive={false}
          onChange={clearAllEvents}
          tooltip={"Clear event log"}
        />
        {false && (
          <ButtonToggle
            icon={Download}
            isActive={false}
            onChange={onDonwload}
            tooltip={"Download event log"}
          />
        )}
      </div>
    </div>
  );
};

const ToolbarMemo = React.memo(Toolbar);
ToolbarMemo.displayName = "Toolbar";

export default ToolbarMemo;
