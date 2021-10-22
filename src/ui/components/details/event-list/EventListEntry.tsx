import * as React from "react";
import { SourceCommitEvent, SourceFiberEvent } from "../../../types";
import { formatDuration } from "../../../utils/duration";

interface EventListFiberEventProps {
  op: SourceFiberEvent["op"] | SourceCommitEvent["op"];
  type: string;
  selected?: boolean;
  showTimings: boolean;
  selfTime?: number;
  totalTime?: number;
  prevConjunction: boolean;
  nextConjunction: boolean;
  updateTrigger?: boolean;
  indirectRootTrigger?: boolean;
  children: React.ReactNode;
  details?: React.ReactNode;
}

const opTooltip: Record<
  SourceFiberEvent["op"] | SourceCommitEvent["op"],
  string
> = {
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
  selected = false,
  selfTime,
  totalTime,
  showTimings,
  prevConjunction,
  nextConjunction,
  updateTrigger = false,
  indirectRootTrigger,
  children: main,
  details,
}: EventListFiberEventProps) => {
  return (
    <div
      data-op={op + (updateTrigger ? "-trigger" : "")}
      data-type={type}
      className={
        "event-list-item" +
        (indirectRootTrigger ? " event-list-item_indirect-root-trigger" : "") +
        (selected ? " event-list-item_selected" : "")
      }
    >
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
      <div className="event-list-item__dots">
        <div className="event-list-item__dot" title={opTooltip[op]} />
        {prevConjunction && <div className="event-list-item__dots-prev" />}
        {nextConjunction && <div className="event-list-item__dots-next" />}
        {indirectRootTrigger && (
          <div className="event-list-item__indirect-root-trigger" />
        )}
      </div>
      <div className="event-list-item__content">
        <div className="event-list-item__main">{main}</div>
        {details}
      </div>
    </div>
  );
};

export default EventListEntry;
