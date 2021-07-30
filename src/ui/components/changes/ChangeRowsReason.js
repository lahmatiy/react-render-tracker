import React from "react";

const ChangeRowsReason = ({ data, type }) => {
  return (
    <>
      {data.map((row, index) => {
        return (
          <tr key={row.index + index}>
            <td>{type}</td>
            <td>{row.name}</td>
            <td>
              <code>{JSON.stringify(row.prev)}</code>
              &nbsp;=>&nbsp;
              <code>{JSON.stringify(row.next)}</code>
            </td>
          </tr>
        );
      })}
    </>
  );
};

export default ChangeRowsReason;
