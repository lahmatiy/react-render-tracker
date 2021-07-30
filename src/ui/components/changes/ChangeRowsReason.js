import React from "react";

const ChangeRowsReason = ({ data, type }) => {
  return (
    <>
      {data.map((row, index) => {
        return (
          <tr key={row.index + index}>
            <td>{type}</td>
            <td>{row.name}</td>
            <td>{JSON.stringify(row.prev)}</td>
            <td>{JSON.stringify(row.next)}</td>
          </tr>
        );
      })}
    </>
  );
};

export default ChangeRowsReason;
