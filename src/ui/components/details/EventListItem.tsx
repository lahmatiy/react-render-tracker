import * as React from "react";
import EventRenderReasons from "./EventRenderReasons";
import ElementId from "../common/ElementId";
import { Event, MessageFiber } from "../../types";
import ElementKey from "../common/ElementKey";
import { formatDuration } from "../../utils/duration";

interface EventListItemProps {
  component: MessageFiber;
  event: Event;
  showTimings: boolean;
  prevConjunction: boolean;
  nextConjunction: boolean;
}

const opTooltip: Record<Event["op"], string> = {
  mount: "Mount",
  update: "Update (re-render)",
  unmount: "Unmount",
};

function getChanges(event: Event) {
  if (event.op !== "update" || event.changes === null) {
    return null;
  }

  const reasons: string[] = [];
  const { context, hooks, props, state } = event.changes;

  if (context) {
    reasons.push("context");
  }

  if (state) {
    reasons.push("state");
  }

  if (props) {
    reasons.push("props");
  }

  if (hooks) {
    reasons.push("hooks");
  }

  return reasons.length > 0 ? reasons : null;
}

const EventListItem = ({
  component,
  event,
  showTimings,
  prevConjunction,
  nextConjunction,
}: EventListItemProps) => {
  const [expanded, setIsCollapsed] = React.useState(false);
  const changes = getChanges(event);
  const isUpdateTrigger =
    changes !== null && (changes.length > 1 || changes[0] !== "props");

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
            {component.displayName ||
              (!component.ownerId ? "Render root" : "Unknown")}
          </span>
          {component.key !== null && <ElementKey component={component} />}
          <ElementId id={component.id} />{" "}
          {changes !== null && (
            <span
              className={
                "event-list-item__changes" + (expanded ? " expanded" : "")
              }
              onClick={() => setIsCollapsed(expanded => !expanded)}
            >
              <span style={{ color: "#999" }}>Changes in</span>{" "}
              {changes.join(", ")}
            </span>
          )}
        </td>
      </tr>
      {event.op === "update" && expanded && (
        <EventRenderReasons changes={event.changes} />
      )}
    </>
  );
};

export default EventListItem;
