import React, { useState } from "react";
import dateFormat from "dateformat";

import ButtonCollapse from "../ui/ButtonCollapse";
import ChangeDetails from "./ChangeDetails";
import ElementId from "../element/ElementId";

const ChangeRow = ({
  phase,
  reason,
  details,
  timestamp,
  displayName,
  elementId,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggle = () => {
    setIsCollapsed(prev => !prev);
  };

  return (
    <>
      <tr>
        <td>
          <ButtonCollapse isCollapsed={isCollapsed} onToggle={handleToggle} />
        </td>
        {displayName && (
          <td>
            {displayName} <ElementId id={elementId} />
          </td>
        )}
        <td>{dateFormat(Number(timestamp), "h:MM:ss.l TT")}</td>
        <td>{phase}</td>
        <td>{reason?.join(", ")}</td>
      </tr>
      {isCollapsed && <ChangeDetails details={details} />}
    </>
  );
};

export default ChangeRow;
