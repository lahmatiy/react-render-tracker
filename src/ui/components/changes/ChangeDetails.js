import React, { useState } from "react";
import dateFormat from "dateformat";

import ButtonCollapse from "../ui/ButtonCollapse";
import ChangeRowsHooks from "./ChangeRowsHooks";

const reasons = ["props", "state", "hooks"];

const ChangeDetails = ({ details }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggle = () => {
    setIsCollapsed(prev => !prev);
  };

  return (
    <>
      {reasons.map(reason => {
        if (details[reason]?.length) {
          const data = details[reason];

          switch (reason) {
            case "hooks": {
              return <ChangeRowsHooks data={data} />;
            }
            case "state": {
              return <ChangeRowsHooks data={data} />;
            }
            case "props": {
              return <ChangeRowsHooks data={data} />;
            }
            default:
              return null;
          }
        }
      })}
    </>
  );
};

export default ChangeDetails;
