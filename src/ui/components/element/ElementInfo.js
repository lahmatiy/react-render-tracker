import React from "react";

import Card from "../ui/Card";

const ElementInfo = ({ data }) => {
  return (
    <Card>
      <table>
        <thead>
        <tr>
          <th>Timestamp</th>
          <th>Phase</th>
          <th>Reason</th>
        </tr>
        </thead>
        <tbody>
        {Object.keys(data.changes || {}).map((timestamp) => {
          const event = data.changes[timestamp];
          return (
            <tr key={timestamp}>
              <td>{timestamp}</td>
              <td>{event.phase}</td>
              <td>{event.reason}</td>
            </tr>
          );
        })}
        </tbody>
      </table>
    </Card>
  );
};

export default ElementInfo;
