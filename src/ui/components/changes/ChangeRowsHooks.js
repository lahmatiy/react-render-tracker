import React from "react";

const ChangeRowsHooks = ({ data }) => {
  return (
    <table>
      <thead>
      <tr>
        <th>Name</th>
        <th>Previous</th>
        <th>Next</th>
      </tr>
      </thead>
      <tbody>
      {data.map(row => {
        console.log(row);
        return (
          <tr key={row.index}>
            <td>{row.name}</td>
            <td>{JSON.stringify(row.prev)}</td>
            <td>{JSON.stringify(row.next)}</td>
          </tr>
        );
      })}
      </tbody>
    </table>
  );
};

export default ChangeRowsHooks;
