import * as React from "react";
import { SourceEvent } from "../../types";
import { useCommit } from "../../utils/fiber-maps";
import { Fiber } from "./Fiber";

interface EventListCommitEventProps {
  commitId: number;
  event: SourceEvent;
  showTimings: boolean;
  prevConjunction: boolean;
  nextConjunction: boolean;
}

const opTooltip: Record<SourceEvent["op"], string> = {
  mount: "Mount",
  update: "Update (re-render)",
  unmount: "Unmount",
  "effect-create": "Create effect",
  "effect-destroy": "Destroy effect",
  "commit-start": "Commit start",
};

const Commit = ({ commitId }: { commitId: number }) => {
  const commit = useCommit(commitId);
  const triggers = commit?.start.event.triggers;

  if (!commit) {
    return null;
  }

  return (
    <>
      {/* <span
        className={
          "event-list-item__name" +
          (op === "unmount" ? " event-list-item__name_unmounted" : "")
        }
      >
        Commit
      </span>
      <FiberId id={commit.start.targetId} /> */}
      <div>
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
          </div>
        ))}
      </div>
    </>
  );
};

const EventListCommitEvent = ({
  commitId,
  event,
  showTimings,
  prevConjunction,
  nextConjunction,
}: EventListCommitEventProps) => {
  return (
    <>
      <div data-type={event.op} className="event-list-item">
        <div className="event-list-item__dots">
          <div className="event-list-item__dot" title={opTooltip[event.op]} />
          {prevConjunction && <div className="event-list-item__dots-prev" />}
          {nextConjunction && <div className="event-list-item__dots-next" />}
        </div>
        {showTimings && (
          <>
            <div className="event-list-item__time" title="Self time">
              {}
            </div>
            <div className="event-list-item__time" title="Total time">
              {}
            </div>
          </>
        )}
        <div className="event-list-item__main">
          <Commit commitId={commitId} />{" "}
        </div>
      </div>
      <div className="event-list-item__indirect-root-trigger" />
    </>
  );
};

export default EventListCommitEvent;
