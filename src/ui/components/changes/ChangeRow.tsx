import React, { useState } from "react";
import dateFormat from "dateformat";
import ButtonCollapse from "../ui/ButtonCollapse";
import ChangeDetails from "./ChangeDetails";
import ElementId from "../element/ElementId";
import { TreeElement, ElementUpdate } from "../../types";

interface IChangeRow {
  component: TreeElement;
  event: ElementUpdate;
}

const ChangeRow = ({ component, event }: IChangeRow) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const hasDetails =
    event.details.props || event.details.state || event.details.hooks;

  const handleToggle = () => {
    setIsCollapsed(prev => !prev);
  };

  return (
    <>
      <tr>
        <td>
          {hasDetails && (
            <ButtonCollapse isCollapsed={isCollapsed} onToggle={handleToggle} />
          )}
        </td>
        <td className="timestamp">
          <span className="timestamp-label">
            {dateFormat(Number(event.timestamp), "HH:MM:ss.l")}
          </span>
        </td>
        <td className="event">
          <span className="event-type-label">{event.phase}</span>
        </td>
        <td className="details">
          {component.displayName || "Unknown"}
          <ElementId id={component.id} /> {event.reason?.join(", ")}
        </td>
      </tr>
      {isCollapsed && <ChangeDetails details={event.details} />}
    </>
  );
};

export default ChangeRow;
