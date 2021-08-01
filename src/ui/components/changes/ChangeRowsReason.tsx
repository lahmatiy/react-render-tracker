import React from "react";

interface IChangeRowsReason {
  type: "Props" | "State" | "Hooks";
  data: any[];
}

const ChangeRowsReason = ({ type, data }: IChangeRowsReason) => {
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

export default ChangeRowsReason;
