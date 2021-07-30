import React, { useState } from "react";

import ChangeRowsHooks from "./ChangeRowsHooks";

const reasons = ["props", "state", "hooks"];

const ChangeDetails = ({ details }) => {
  return (
    <tr>
      <td colSpan={4}>
        {reasons.map(reason => {
          if (details[reason]?.length) {
            const data = details[reason];

            switch (reason) {
              case "hooks": {
                return <ChangeRowsHooks data={data} key={reason} />;
              }
              case "state": {
                return <ChangeRowsHooks data={data} key={reason} />;
              }
              case "props": {
                return <ChangeRowsHooks data={data} key={reason} />;
              }
              default:
                return null;
            }
          }
        })}
      </td>
    </tr>
  );
};

export default ChangeDetails;
