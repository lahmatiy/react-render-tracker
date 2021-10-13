import * as React from "react";
import { formatDuration } from "../../utils/duration";
import { SourceEvent } from "../../types";

interface EventListFiberEventProps {
  op: SourceEvent["op"];
  type: string;
  children: React.ReactNode;
  details?: React.ReactNode;
  showTimings: boolean;
  selfTime?: number;
  totalTime?: number;
  prevConjunction: boolean;
  nextConjunction: boolean;
  rootTrigger?: boolean;
  updateTrigger?: boolean;
  indirectRootTrigger?: boolean;
}

const opTooltip: Record<SourceEvent["op"], string> = {
  mount: "Mount",
  update: "Update",
  "update-bailout": "Update bailout",
  unmount: "Unmount",
  "effect-create": "Create effect",
  "effect-destroy": "Destroy effect",
  "commit-start": "Commit start",
};

const EventListEntry = ({
  op,
  type,
  children: main,
  details,
  selfTime,
  totalTime,
  showTimings,
  prevConjunction,
  nextConjunction,
  rootTrigger = false,
  updateTrigger = false,
  indirectRootTrigger,
}: EventListFiberEventProps) => {
  return (
    <>
      <div
        data-op={op}
        data-type={type}
        className={
          "event-list-item" +
          (rootTrigger ? " event-list-item_root-trigger" : "")
        }
      >
        <div className="event-list-item__dots">
          {updateTrigger && (
            <div
              className="event-list-item__update-trigger"
              title="Update trigger"
            />
          )}
          <div className="event-list-item__dot" title={opTooltip[op]} />
          {prevConjunction && <div className="event-list-item__dots-prev" />}
          {nextConjunction && <div className="event-list-item__dots-next" />}
        </div>
        {showTimings && (
          <>
            <div className="event-list-item__time" title="Self time">
              {typeof selfTime === "number" && formatDuration(selfTime)}
            </div>
            <div className="event-list-item__time" title="Total time">
              {typeof totalTime === "number" && formatDuration(totalTime)}
            </div>
          </>
        )}
        <div className="event-list-item__main">{main}</div>
      </div>
      {details}
      {indirectRootTrigger && (
        <div className="event-list-item__indirect-root-trigger" />
      )}
    </>
  );
};

export default EventListEntry;
