import * as React from "react";
import { SourceFiberEvent, FiberChanges } from "../../../types";
import { useSelectionState } from "../../../utils/selection";
import { EventChangesSummary } from "../EventChangesSummary";
import { Fiber } from "../Fiber";
import EventListEntry from "./EventListEntry";
import EventRenderReasons from "./EventRenderReasons";

interface EventListFiberEventProps {
  fiberId: number;
  event: SourceFiberEvent;
  changes: FiberChanges | null;
  showTimings: boolean;
  prevConjunction: boolean;
  nextConjunction: boolean;
  indirectRootTrigger?: boolean;
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
  const [expanded, setExpanded] = React.useState(false);
  const toggleExpanded = React.useCallback(
    () => setExpanded(expanded => !expanded),
    []
  );
  const { selected } = useSelectionState(fiberId);
  const isUpdateTrigger = event.op === "update" && event.trigger === undefined;
  const details = (event.op === "update" ||
    event.op === "update-bailout-scu") &&
    expanded && (
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
      <Fiber fiberId={fiberId} unmounted={event.op === "unmount"} />
      <EventChangesSummary
        changes={changes}
        expanded={expanded}
        toggleExpanded={toggleExpanded}
      />
    </EventListEntry>
  );
};

export default EventListFiberEvent;
