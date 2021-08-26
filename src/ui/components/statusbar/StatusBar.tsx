import * as React from "react";
import { useEventsContext } from "../../utils/events";
import { useGlobalMaps } from "../../utils/global-maps";

function plural(num: number, single: string, multiple = single + "s") {
  return `${num} ${num === 1 ? single : multiple}`;
}

const StatusBar = () => {
  const {
    loadedEventsCount,
    totalEventsCount,
    mountCount,
    unmountCount,
    rerenderCount,
  } = useEventsContext();
  const pendingEventsCount = totalEventsCount - loadedEventsCount;
  const pendingEventsOffset = React.useRef(-1);
  const { componentById } = useGlobalMaps();
  const componentCount = componentById.size;

  if (pendingEventsCount > 0) {
    if (pendingEventsOffset.current === -1) {
      pendingEventsOffset.current = loadedEventsCount;
    }
  } else {
    pendingEventsOffset.current = -1;
  }

  return (
    <div className="statusbar">
      <span className="statusbar__summary">
        {totalEventsCount === 0 ? (
          "No events"
        ) : (
          <>
            {plural(loadedEventsCount, "event")} for{" "}
            {plural(componentCount, "component instance")}
          </>
        )}
      </span>
      {pendingEventsCount > 0 && (
        <span
          className="statusbar__pending"
          style={
            {
              "--progress": `${(
                (100 * (loadedEventsCount - pendingEventsOffset.current)) /
                (totalEventsCount - pendingEventsOffset.current)
              ).toFixed(3)}%`,
            } as React.CSSProperties
          }
        >
          {plural(pendingEventsCount, "pending event")}
        </span>
      )}
      <span className="statusbar__event-type-count" data-type="mount">
        {mountCount}
      </span>
      <span className="statusbar__event-type-count" data-type="rerender">
        {rerenderCount}
      </span>
      <span className="statusbar__event-type-count" data-type="unmount">
        {unmountCount}
      </span>
    </div>
  );
};

export default StatusBar;
