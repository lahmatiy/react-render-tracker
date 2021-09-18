import * as React from "react";
import EventRenderReasons from "./EventRenderReasons";
import FiberId from "../common/FiberId";
import FiberKey from "../common/FiberKey";
import { formatDuration } from "../../utils/duration";
import { Event, MessageFiber } from "../../types";
import { TransferNamedEntryChange } from "common-types";

interface EventListItemProps {
  fiber: MessageFiber;
  event: Event;
  showTimings: boolean;
  prevConjunction: boolean;
  nextConjunction: boolean;
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

  if (context) {
    reasons.push("context");
    hasShallowEqual ||= context.some(isShallowEqual);
  }

  if (state) {
    reasons.push("state");
    hasShallowEqual ||= state.some(isShallowEqual);
  }

  if (props) {
    reasons.push("props");
  }

  return reasons.length > 0 ? { reasons, hasShallowEqual } : null;
}

const EventListItem = ({
  fiber,
  event,
  showTimings,
  prevConjunction,
  nextConjunction,
}: EventListItemProps) => {
  const [expanded, setIsCollapsed] = React.useState(false);
  const changes = getChanges(event);
  const isUpdateTrigger =
    changes !== null &&
    (changes.reasons.length > 1 || changes.reasons[0] !== "props");

  return (
    <>
      <tr className="event-list-item">
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
          <span
            className={
              "event-list-item__name" +
              (event.op === "unmount" ? " event-list-item__name_unmounted" : "")
            }
          >
            {fiber.displayName || (!fiber.ownerId ? "Render root" : "Unknown")}
          </span>
          {fiber.key !== null && <FiberKey fiber={fiber} />}
          <FiberId id={fiber.id} />{" "}
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
        <EventRenderReasons changes={event.changes} />
      )}
    </>
  );
};

export default EventListItem;
