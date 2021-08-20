import React, { useState } from "react";
import dateFormat from "dateformat";
import ButtonCollapse from "../common/ButtonExpand";
import EventRenderReason from "./EventRenderReasonDetails";
import ElementId from "../common/ElementId";
import { TreeElement, Event } from "../../types";

interface EventListItemProps {
  component: TreeElement;
  event: Event;
}

function getReasons(event: Event) {
  const reasons: string[] = [];

  if (event.op === "render") {
    const { context, hooks, props, state, parentUpdate } = event.changes || {};

    if (context) {
      reasons.push("Context change");
    }

    if (hooks) {
      reasons.push("Hooks change");
    }

    if (props) {
      reasons.push("Props change");
    }

    if (state) {
      reasons.push("State change");
    }

    if (parentUpdate) {
      reasons.push("Parent Update");
    }
  }

  return reasons;
}

const EventListItem = ({ component, event }: EventListItemProps) => {
  const [expanded, setIsCollapsed] = useState(false);
  const hasDetails =
    event.op === "render" &&
    (event.changes?.props || event.changes?.state || event.changes?.hooks);

  return (
    <>
      <tr className="event-list-item">
        <td>
          {hasDetails && (
            <ButtonCollapse expanded={expanded} setExpanded={setIsCollapsed} />
          )}
        </td>
        <td className="event-list-item__timestamp">
          <span className="event-list-item__timestamp-label">
            {dateFormat(Number(event.timestamp), "HH:MM:ss.l")}
          </span>
        </td>
        <td className="event-list-item__event-type">
          <span className="event-list-item__event-type-label">{event.op}</span>
        </td>
        <td className="event-list-item__details">
          {component.displayName || "Unknown"}
          <ElementId id={component.id} /> {getReasons(event).join(", ")}{" "}
          {event.op === "render" && event.selfDuration.toFixed(1)}ms{" "}
          {event.op === "render" && event.actualDuration.toFixed(1)}ms
        </td>
      </tr>
      {event.op === "render" && expanded && (
        <EventRenderReason changes={event.changes} />
      )}
    </>
  );
};

export default EventListItem;
