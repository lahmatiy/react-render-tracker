import * as React from "react";
import EventRenderReasons from "./EventRenderReasons";
import FiberId from "../common/FiberId";
import FiberKey from "../common/FiberKey";
import { formatDuration } from "../../utils/duration";
import { Event } from "../../types";
import { TransferNamedEntryChange } from "common-types";
import { useFiber } from "../../utils/fiber-maps";

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

function isShallowEqual(entry: TransferNamedEntryChange) {
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

  if (!fiber) {
    return null;
  }

  return (
    <>
      <span
        className={
          "event-list-item__name" +
          (op === "unmount" ? " event-list-item__name_unmounted" : "")
        }
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
      <tr
        className={
          "event-list-item" +
          (rootTrigger ? " event-list-item_root-trigger" : "")
        }
      >
        {showTimings && (
          <>
            <td className="event-list-item__time" title="Self time">
              {(event.op === "mount" || event.op === "update") &&
                formatDuration(event.selfTime)}
            </td>
            <td className="event-list-item__time" title="Total time">
              {(event.op === "mount" || event.op === "update") &&
                formatDuration(event.totalTime)}
            </td>
          </>
        )}
        <td className="event-list-item__dots">
          <span
            className={
              "event-list-item__dot" +
              (prevConjunction ? " event-list-item__dot_prev" : "") +
              (nextConjunction ? " event-list-item__dot_next" : "")
            }
            title={opTooltip[event.op]}
            data-type={event.op}
          >
            {"\xa0"}
          </span>
        </td>
        <td className="event-list-item__main">
          {event.op === "update" && isUpdateTrigger && (
            <span
              className="event-list-item__update-trigger"
              title={"Update trigger"}
            />
          )}
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
              <span style={{ color: "#999" }}>Changes in</span>{" "}
              {changes.reasons.join(", ")}
            </span>
          )}
          {(event.op === "effect-create" || event.op === "effect-destroy") &&
          event.path
            ? event.path.join(" → ")
            : ""}
        </td>
      </tr>
      {event.op === "update" && expanded && (
        <EventRenderReasons
          changes={event.changes}
          nextConjunction={nextConjunction}
        />
      )}
      {indirectRootTrigger && (
        <tr>
          <td className="event-list-item__indirect-root-trigger"></td>
        </tr>
      )}
    </>
  );
};

export default EventListItem;
