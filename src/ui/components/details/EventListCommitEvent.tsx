import * as React from "react";
import { CommitTrigger, SourceCommitEvent } from "../../types";
import { useCommit } from "../../utils/fiber-maps";
import EventListEntry from "./EventListEntry";
import { Fiber } from "./Fiber";

interface EventListCommitEventProps {
  commitId: number;
  event: SourceCommitEvent;
  showTimings: boolean;
  prevConjunction: boolean;
  nextConjunction: boolean;
}

function CallStack({ stack }: { stack: string }) {
  const [state, setState] = React.useState(false);
  if (!state) {
    return (
      <span
        onClick={() => setState(true)}
        style={{
          display: "inline-block",
          textDecoration: "underline",
          cursor: "pointer",
          marginLeft: "6px",
          color: "#888",
        }}
      >
        stack trace
      </span>
    );
  }

  return <pre style={{ fontSize: "11px", margin: "0 0 0 8px" }}>{stack}</pre>;
}

const CommitTriggers = ({ triggers }: { triggers: CommitTrigger[] }) => {
  return (
    <div className="event-list-item__commit-details">
      {triggers?.map((trigger, idx) => (
        <div key={idx}>
          [{trigger.type}] {trigger.event}{" "}
          {trigger.relatedFiberId &&
            trigger.relatedFiberId !== trigger.fiberId && (
              <>
                <Fiber fiberId={trigger.relatedFiberId} /> →{" "}
              </>
            )}
          <Fiber fiberId={trigger.fiberId} />
          {trigger.stack && <CallStack stack={trigger.stack} />}
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
          {
            triggers.reduce(
              (ids, trigger) => ids.add(trigger.fiberId),
              new Set()
            ).size
          }{" "}
          triggers
        </span>
      )}
    </EventListEntry>
  );
};

export default EventListCommitEvent;
