import * as React from "react";
import ButtonToggle from "../../components/common/ButtonToggle";
import { useEventsContext } from "../../utils/events";
import {
  ClearEventLog,
  Pause,
  Play,
  BreakRefs,
  ExposeToGlobal,
} from "../../components/common/icons";
import { FeatureMemLeaks } from "../../../common/constants";
import { useMemoryLeaks } from "../../utils/memory-leaks";
import { useFiberMaps } from "../../utils/fiber-maps";
import ComponentSearch from "./ComponentSearch";

interface ToolbarProps {
  filter: string;
  setFilter: (filter: string) => void;
}

const Toolbar = ({ filter, setFilter }: ToolbarProps) => {
  const { leakedFibers } = useFiberMaps();
  const { clearAllEvents, paused, setPaused } = useEventsContext();
  const { breakLeakedObjectRefs, exposeLeakedObjectsToGlobal } =
    useMemoryLeaks();

  return (
    <div className="toolbar">
      <ComponentSearch value={filter} setValue={setFilter} />
      <div className="toolbar__buttons">
        {FeatureMemLeaks && (
          <>
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
            <span className="toolbar__buttons-splitter" />
          </>
        )}

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
      </div>
    </div>
  );
};

const ToolbarMemo = React.memo(Toolbar);
ToolbarMemo.displayName = "Toolbar";

export default ToolbarMemo;
