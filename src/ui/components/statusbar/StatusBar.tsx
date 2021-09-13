import * as React from "react";
import { useEventsContext } from "../../utils/events";
import { useFiberMaps } from "../../utils/fiber-maps";

function plural(num: number, single: string, multiple = single + "s") {
  return `${num} ${num === 1 ? single : multiple}`;
}

const StatusBar = () => {
  const {
    loadingStartOffset,
    loadedEventsCount,
    totalEventsCount,
    mountCount,
    unmountCount,
    rerenderCount,
  } = useEventsContext();
  const pendingEventsCount = totalEventsCount - loadedEventsCount;
  const { fiberById } = useFiberMaps();
  const fiberCount = fiberById.size;

  return (
    <div className="statusbar">
      <span className="statusbar__summary">
        {totalEventsCount > 0
          ? plural(loadedEventsCount, "event")
          : "No events"}
        {fiberCount > 0
          ? ` for ${plural(fiberCount, "component instance")}`
          : ""}
      </span>
      {pendingEventsCount > 0 && (
        <span
          className="statusbar__pending"
          style={
            {
              "--progress": `${(
                (100 * (loadedEventsCount - loadingStartOffset)) /
                (totalEventsCount - loadingStartOffset)
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
      <span className="statusbar__event-type-count" data-type="update">
        {rerenderCount}
      </span>
      <span className="statusbar__event-type-count" data-type="unmount">
        {unmountCount}
      </span>
    </div>
  );
};

const StatusBarMemo = React.memo(StatusBar);
StatusBarMemo.displayName = "StatusBar";

export default StatusBarMemo;
