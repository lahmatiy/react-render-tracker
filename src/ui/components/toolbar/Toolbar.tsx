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
  BreakRefs,
  ExposeToGlobal,
} from "../common/icons";
import { useMemoryLeaks } from "../../utils/memory-leaks";
import { FeatureMemLeaks } from "../../../common/constants";
import { useFiberMaps } from "../../utils/fiber-maps";

type BooleanToggle = (fn: (state: boolean) => boolean) => void;
interface ToolbarProps {
  onGroupingChange: BooleanToggle;
  groupByParent: boolean;
  onShowUnmounted: BooleanToggle;
  showUnmounted: boolean;
  onShowTimings: BooleanToggle;
  showTimings: boolean;
}

const DownloadButton = () => {
  const { allEvents } = useEventsContext();
  const downloadAnchorRef = React.useRef<HTMLAnchorElement | null>(null);
  const onDownload = React.useCallback(() => {
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
    <ButtonToggle
      icon={Download}
      onChange={onDownload}
      tooltip={"Download event log"}
    />
  );
};

const Toolbar = ({
  onGroupingChange,
  groupByParent,
  onShowUnmounted,
  showUnmounted,
  onShowTimings,
  showTimings,
}: ToolbarProps) => {
  const { leakedFibers } = useFiberMaps();
  const { clearAllEvents, paused, setPaused } = useEventsContext();
  const { breakLeakedObjectRefs, exposeLeakedObjectsToGlobal } =
    useMemoryLeaks();

  return (
    <div className="toolbar">
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

        {FeatureMemLeaks && (
          <>
            <span className="toolbar__buttons-splitter" />

            <ButtonToggle
              icon={BreakRefs}
              onChange={breakLeakedObjectRefs}
              tooltip={
                "Break leaked React objects references\n\nWARNING: This action interferes with how React works, which can lead to behavior that is not possible naturally. Such interference can break the functionality of React. However, this technique allows you to localize the source of the memory leak and greatly simplify the investigation of root causes. Use with caution and for debugging purposes only."
              }
            />
            <ButtonToggle
              icon={ExposeToGlobal}
              onChange={() => exposeLeakedObjectsToGlobal([...leakedFibers])}
              tooltip={
                "Store potential leaked objects as global variable.\n\nThis allows to investigate retainers in a heap snapshot."
              }
            />
          </>
        )}

        <span className="toolbar__buttons-splitter" />

        <ButtonToggle
          icon={ClearEventLog}
          onChange={clearAllEvents}
          tooltip={"Clear event log"}
        />

        <ButtonToggle
          icon={!paused ? Play : Pause}
          isActive={!paused}
          onChange={() => setPaused(!paused)}
          tooltip={paused ? "Resume event loading" : "Pause event loading"}
        />
        {false && <DownloadButton />}
      </div>
    </div>
  );
};

const ToolbarMemo = React.memo(Toolbar);
ToolbarMemo.displayName = "Toolbar";

export default ToolbarMemo;
