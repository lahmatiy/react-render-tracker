import * as React from "react";
import EventRenderReasons from "./EventRenderReasons";
import { formatDuration } from "../../utils/duration";
import {
  SourceEvent,
  TransferNamedEntryChange,
  TransferContextChange,
} from "../../types";
import { Fiber } from "./Fiber";

interface EventListFiberEventProps {
  fiberId: number;
  event: SourceEvent;
  showTimings: boolean;
  prevConjunction: boolean;
  nextConjunction: boolean;
  rootTrigger?: boolean;
  indirectRootTrigger?: boolean;
}

const opTooltip: Record<SourceEvent["op"], string> = {
  mount: "Mount",
  update: "Update (re-render)",
  unmount: "Unmount",
  "effect-create": "Create effect",
  "effect-destroy": "Destroy effect",
  "commit-start": "Commit start",
};

function isShallowEqual(
  entry: TransferNamedEntryChange | TransferContextChange
) {
  return entry.diff === false;
}

function getChanges(event: SourceEvent) {
  if (event.op !== "update" || event.changes === null) {
    return null;
  }

  const { context, props, state } = event.changes;
  const reasons: string[] = [];
  let hasShallowEqual = false;

  if (props) {
    reasons.push("props");
  }

  if (context) {
    reasons.push("context");
    hasShallowEqual ||= context.some(isShallowEqual);
  }

  if (state) {
    reasons.push("state");
    hasShallowEqual ||= state.some(isShallowEqual);
  }

  return reasons.length > 0 ? { reasons, hasShallowEqual } : null;
}

const EventListFiberEvent = ({
  fiberId,
  event,
  showTimings,
  prevConjunction,
  nextConjunction,
  rootTrigger,
  indirectRootTrigger,
}: EventListFiberEventProps) => {
  const [expanded, setIsCollapsed] = React.useState(false);
  const changes = getChanges(event);
  const isUpdateTrigger = event.op === "update" && event.trigger === undefined;

  return (
    <>
      <div
        data-type={event.op}
        className={
          "event-list-item" +
          (rootTrigger ? " event-list-item_root-trigger" : "")
        }
      >
        <div className="event-list-item__dots">
          {event.op === "update" && isUpdateTrigger && (
            <div
              className="event-list-item__update-trigger"
              title={"Update trigger"}
            />
          )}
          <div className="event-list-item__dot" title={opTooltip[event.op]} />
          {prevConjunction && <div className="event-list-item__dots-prev" />}
          {nextConjunction && <div className="event-list-item__dots-next" />}
        </div>
        {showTimings && (
          <>
            <div className="event-list-item__time" title="Self time">
              {(event.op === "mount" || event.op === "update") &&
                formatDuration(event.selfTime)}
            </div>
            <div className="event-list-item__time" title="Total time">
              {(event.op === "mount" || event.op === "update") &&
                formatDuration(event.totalTime)}
            </div>
          </>
        )}
        <div className="event-list-item__main">
          <Fiber fiberId={fiberId} unmounted={event.op === "unmount"} />{" "}
          {changes !== null && (
            <span
              className={
                "event-list-item__changes" +
                (expanded ? " expanded" : "") +
                (changes.hasShallowEqual ? " has-warnings" : "")
              }
              onClick={() => setIsCollapsed(expanded => !expanded)}
            >
              {"± "}
              {changes.reasons.map(reason => (
                <span key={reason} className="event-list-item__changes-reason">
                  {reason}
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
      {event.op === "update" && expanded && (
        <EventRenderReasons
          fiberId={fiberId}
          changes={event.changes}
          nextConjunction={nextConjunction}
        />
      )}
      {indirectRootTrigger && (
        <div className="event-list-item__indirect-root-trigger" />
      )}
    </>
  );
};

export default EventListFiberEvent;
