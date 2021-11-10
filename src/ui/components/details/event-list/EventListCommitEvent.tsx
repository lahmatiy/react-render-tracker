import * as React from "react";
import { CommitTrigger, SourceCommitEvent } from "../../../types";
import { useCommit } from "../../../utils/fiber-maps";
import EventListEntry from "./EventListEntry";
import { Fiber } from "../Fiber";
import SourceLoc from "../../common/SourceLoc";

interface EventListCommitEventProps {
  commitId: number;
  event: SourceCommitEvent;
  showTimings: boolean;
  prevConjunction: boolean;
  nextConjunction: boolean;
}

const CommitTriggers = ({ triggers }: { triggers: CommitTrigger[] }) => {
  return (
    <div className="event-list-item__commit-details">
      {triggers?.map((trigger, idx) => (
        <div key={idx}>
          {trigger.relatedFiberId &&
            trigger.relatedFiberId !== trigger.fiberId && (
              <>
                <Fiber fiberId={trigger.relatedFiberId} />
                {" → "}
              </>
            )}
          <Fiber fiberId={trigger.fiberId} />
          <div style={{ margin: "0 0 2px 10px" }}>
            [{trigger.event ? `${trigger.type} ${trigger.event}` : trigger.type}
            ] {<SourceLoc loc={trigger.loc}>{trigger.kind}</SourceLoc>}
          </div>
        </div>
      ))}
    </div>
  );
};

const EventListCommitEvent = ({
  commitId,
  event,
  showTimings,
  prevConjunction,
  nextConjunction,
}: EventListCommitEventProps) => {
  const [expanded, setIsCollapsed] = React.useState(false);
  const commit = useCommit(commitId);
  const triggers = commit?.start.event.triggers;
  const triggerFiberCount =
    triggers?.reduce((ids, trigger) => ids.add(trigger.fiberId), new Set())
      .size || 0;
  const details = triggers && expanded && (
    <CommitTriggers triggers={triggers} />
  );

  return (
    <EventListEntry
      op={event.op}
      type="commit"
      details={details}
      showTimings={showTimings}
      prevConjunction={prevConjunction}
      nextConjunction={nextConjunction}
    >
      <span className="event-list-item__commit-name">Commit #{commitId}</span>
      {triggers && (
        <span
          className={
            "event-list-item__commit-triggers" + (expanded ? " expanded" : "")
          }
          onClick={() => setIsCollapsed(expanded => !expanded)}
        >
          {triggerFiberCount}
          {triggerFiberCount > 1 ? " triggers" : " trigger"}
        </span>
      )}
    </EventListEntry>
  );
};

export default EventListCommitEvent;
