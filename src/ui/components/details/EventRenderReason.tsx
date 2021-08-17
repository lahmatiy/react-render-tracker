import React from "react";

interface EventRenderReasonProps {
  type: "Props" | "State" | "Hooks";
  data: any[];
}

const EventRenderReason = ({ type, data }: EventRenderReasonProps) => {
  return (
    <>
      {data.map((row, index) => {
        return (
          <tr key={row.index + index}>
            <td>{type}</td>
            <td>{row.name}</td>
            <td>
              <code>{JSON.stringify(row.prev)}</code>
              &nbsp;=&gt;&nbsp;
              <code>{JSON.stringify(row.next)}</code>
            </td>
          </tr>
        );
      })}
    </>
  );
};

export default EventRenderReason;
