import React, { useState } from "react";
import dateFormat from "dateformat";

import ButtonCollapse from "../ui/ButtonCollapse";
import ChangeDetails from "./ChangeDetails";

const ChangeRow = ({ event, timestamp, displayName }) => {
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
        {displayName && <td>{displayName}</td>}
        <td>{dateFormat(timestamp, "h:MM:ss.l TT")}</td>
        <td>{event.phase}</td>
        <td>{event.reason?.join(", ")}</td>
      </tr>
      {isCollapsed && <ChangeDetails details={event.details} />}
    </>
  );
};

export default ChangeRow;
