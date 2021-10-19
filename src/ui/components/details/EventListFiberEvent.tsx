import * as React from "react";
import EventRenderReasons from "./EventRenderReasons";
import {
  SourceFiberEvent,
  FiberChanges,
  FiberContextChange,
  FiberStateChange,
} from "../../types";
import { Fiber } from "./Fiber";
import EventListEntry from "./EventListEntry";
import { useSelectionState } from "../../utils/selection";

interface EventListFiberEventProps {
  fiberId: number;
  event: SourceFiberEvent;
  changes: FiberChanges | null;
  showTimings: boolean;
  prevConjunction: boolean;
  nextConjunction: boolean;
  indirectRootTrigger?: boolean;
}

function isShallowEqual(entry: FiberContextChange | FiberStateChange) {
  return entry.diff === false;
}

function getChangesSummary(changes: FiberChanges) {
  const { context, props, state } = changes;
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
  changes,
  showTimings,
  prevConjunction,
  nextConjunction,
  indirectRootTrigger,
}: EventListFiberEventProps) => {
  const [expanded, setIsCollapsed] = React.useState(false);
  const { selected } = useSelectionState(fiberId);
  const changesSummary = changes !== null ? getChangesSummary(changes) : null;
  const isUpdateTrigger = event.op === "update" && event.trigger === undefined;
  const details = event.op === "update" && expanded && (
    <EventRenderReasons
      fiberId={fiberId}
      changes={changes}
      nextConjunction={nextConjunction}
    />
  );

  return (
    <EventListEntry
      op={event.op}
      type="fiber"
      selected={selected}
      showTimings={showTimings}
      selfTime={
        event.op === "mount" || event.op === "update"
          ? event.selfTime
          : undefined
      }
      totalTime={
        event.op === "mount" || event.op === "update"
          ? event.totalTime
          : undefined
      }
      prevConjunction={prevConjunction}
      nextConjunction={nextConjunction}
      updateTrigger={event.op === "update" && isUpdateTrigger}
      indirectRootTrigger={indirectRootTrigger}
      details={details}
    >
      <Fiber fiberId={fiberId} unmounted={event.op === "unmount"} />{" "}
      {changesSummary !== null && (
        <span
          className={
            "event-list-item__fiber-changes" +
            (expanded ? " expanded" : "") +
            (changesSummary.hasShallowEqual ? " has-warnings" : "")
          }
          onClick={() => setIsCollapsed(expanded => !expanded)}
        >
          {"± "}
          {changesSummary.reasons.map(reason => (
            <span
              key={reason}
              className="event-list-item__fiber-changes-reason"
            >
              {reason}
            </span>
          ))}
        </span>
      )}
    </EventListEntry>
  );
};

export default EventListFiberEvent;
