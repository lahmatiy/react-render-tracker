import * as React from "react";
import EventRenderReasons from "./EventRenderReasons";
import FiberId from "../common/FiberId";
import FiberKey from "../common/FiberKey";
import { formatDuration } from "../../utils/duration";
import {
  Event,
  TransferNamedEntryChange,
  TransferContextChange,
} from "../../types";
import { useFiber } from "../../utils/fiber-maps";
import { useSelectionState } from "../../utils/selection";

interface EventListItemProps {
  fiberId: number;
  event: Event;
  showTimings: boolean;
  prevConjunction: boolean;
  nextConjunction: boolean;
  rootTrigger?: boolean;
  indirectRootTrigger?: boolean;
}

const opTooltip: Record<Event["op"], string> = {
  mount: "Mount",
  update: "Update (re-render)",
  unmount: "Unmount",
  "effect-create": "Create effect",
  "effect-destroy": "Destroy effect",
};

function isShallowEqual(
  entry: TransferNamedEntryChange | TransferContextChange
) {
  return entry.diff === false;
}

function getChanges(event: Event) {
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

const Fiber = ({ fiberId, op }: { fiberId: number; op: Event["op"] }) => {
  const fiber = useFiber(fiberId);
  const { selected, select } = useSelectionState(fiberId);

  if (!fiber) {
    return null;
  }

  return (
    <>
      <span
        className={
          "event-list-item__name" +
          (op === "unmount" ? " event-list-item__name_unmounted" : "") +
          (selected
            ? " event-list-item__name_selected"
            : " event-list-item__name_link")
        }
        onClick={!selected ? () => select(fiberId) : undefined}
      >
        {fiber.displayName}
      </span>
      {fiber.key !== null && <FiberKey fiber={fiber} />}
      <FiberId id={fiber.id} />
    </>
  );
};

const EventListItem = ({
  fiberId,
  event,
  showTimings,
  prevConjunction,
  nextConjunction,
  rootTrigger,
  indirectRootTrigger,
}: EventListItemProps) => {
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
          <Fiber fiberId={fiberId} op={event.op} />{" "}
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
          {(event.op === "effect-create" || event.op === "effect-destroy") &&
          event.path
            ? event.path.join(" → ")
            : ""}
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

export default EventListItem;
