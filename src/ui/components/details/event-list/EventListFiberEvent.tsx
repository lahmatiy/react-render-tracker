import * as React from "react";
import { SourceFiberEvent, FiberChanges } from "../../../types";
import { useSelectionState } from "../../../utils/selection";
import { ResolveSourceLoc } from "../../common/SourceLoc";
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

function getSpecialBadges(
  event: SourceFiberEvent
): null | Array<{ name: string; loc: string | null; bailout?: boolean }> {
  switch (event.op) {
    case "update":
      return event.specialReasons;

    case "update-bailout-state":
      return [{ name: "No state changes", bailout: true, loc: null }];

    case "update-bailout-memo":
      return [{ name: "React.memo()", bailout: true, loc: null }];

    case "update-bailout-scu":
      return [{ name: "shouldComponentUpdate()", bailout: true, loc: null }];

    default:
      return null;
  }
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
  const specialBadges = getSpecialBadges(event);
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
      {specialBadges?.map((reason, index) => (
        <span
          key={index}
          className={
            "special-reason" + (reason.bailout ? " special-reason_bailout" : "")
          }
        >
          <ResolveSourceLoc loc={reason.loc}>{reason.name}</ResolveSourceLoc>
        </span>
      ))}
    </EventListEntry>
  );
};

export default EventListFiberEvent;
