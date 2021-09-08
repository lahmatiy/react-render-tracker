import * as React from "react";
// import dateFormat from "dateformat";
import EventRenderReasons from "./EventRenderReasons";
import ElementId from "../common/ElementId";
import { Event, MessageElement } from "../../types";
import ElementKey from "../common/ElementKey";

interface EventListItemProps {
  component: MessageElement;
  event: Event;
  prevConjunction: boolean;
  nextConjunction: boolean;
}

const opTooltip: Record<Event["op"], string> = {
  mount: "Mount",
  rerender: "Update (re-render)",
  unmount: "Unmount",
};

function getChanges(event: Event) {
  const reasons: string[] = [];

  if (event.op === "rerender") {
    const { context, hooks, props, state } = event.changes || {};

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
  }

  return reasons;
}

function formatDuration(duration: number) {
  let unit = "ms";

  if (duration >= 100) {
    duration /= 1000;
    unit = "s";
  }

  if (duration >= 100) {
    duration /= 60;
    unit = "m";
  }

  return duration.toFixed(1) + unit;
}

const EventListItem = ({
  component,
  event,
  prevConjunction,
  nextConjunction,
}: EventListItemProps) => {
  const [expanded, setIsCollapsed] = React.useState(false);
  const changes = getChanges(event);

  return (
    <>
      <tr className="event-list-item">
        <td className="event-list-item__time" title="Self time">
          {(event.op === "mount" || event.op === "rerender") &&
            formatDuration(event.selfTime)}
        </td>
        <td className="event-list-item__time" title="Total time">
          {(event.op === "mount" || event.op === "rerender") &&
            formatDuration(event.totalTime)}
        </td>
        {/* <td className="event-list-item__timestamp">
          <span className="event-list-item__timestamp-label">
            {dateFormat(Number(event.timestamp), "HH:MM:ss.l")}
          </span>
        </td> */}
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
          {event.op === "rerender" && !event.ownerUpdate && (
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
          {changes.length > 0 && (
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
      {event.op === "rerender" && expanded && (
        <EventRenderReasons changes={event.changes} />
      )}
    </>
  );
};

export default EventListItem;
